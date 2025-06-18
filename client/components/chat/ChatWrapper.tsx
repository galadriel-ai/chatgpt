import React, { useEffect, useRef, useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedChatInput } from '@/components/theme/ThemedChatInput'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { NewChatIcon, SideBarIcon } from '@/components/icons/Icons'
import { useChat } from '@/context/ChatContext'
import { ThemedText } from '@/components/theme/ThemedText'
import { Chat, ChatConfiguration, Message } from '@/types/chat'
import { api, ChatChunk } from '@/lib/api'
import { AttachmentFile } from '@/hooks/useMediaAttachments'
import { useRouter } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { EVENTS } from '@/lib/analytics/posthog'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatMessage } from '@/components/chat/messages/ChatMessage'
import { ErrorMessage } from '@/components/chat/messages/ChatErrorMessage'
import { BackgroundProcessingMessage } from './messages/BackgroundProcessingMessage'
import { NewChatModal } from '@/components/chat/NewChatModal'

export function ChatWrapper() {
  const navigation = useNavigation()
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)
  const posthog = usePostHog()
  const insets = useSafeAreaInsets()

  const {
    selectedChat,
    setSelectedChat,
    activeChat,
    setActiveChat,
    addChat,
    selectedChatConfiguration,
    setSelectedChatConfiguration,
  } = useChat()
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [backgroundProcessingMessage, setBackgroundProcessingMessage] = useState<string>('')
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (selectedChat && !activeChat) {
      getChatDetails(selectedChat)
      setIsNewChatModalOpen(false)
    } else if (!selectedChat && !activeChat) {
      setMessages([])
      // TODO:?
      if (selectedChatConfiguration === undefined) setIsNewChatModalOpen(true)
    }
  }, [selectedChat])

  useEffect(() => {
    if (activeChat) setMessages(activeChat.messages)
  }, [activeChat])

  const scrollToBottom = (animated = true) => {
    // Wait a tiny bit to make sure the message was rendered
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated })
    }, 100)
  }

  const onConfigureNewChat = () => {
    setIsNewChatModalOpen(true)
  }

  const onNewChat = (configuration: ChatConfiguration | null) => {
    posthog.capture(EVENTS.NEW_CHAT_STARTED)
    setSelectedChatConfiguration(configuration)
    setSelectedChat(null)
    setActiveChat(null)
    setMessages([])
    setErrorMessage('')
    setIsNewChatModalOpen(false)
    router.push('/')
  }

  const getChatDetails = async (chat: Chat): Promise<void> => {
    const chatDetails = await api.getChatDetails(chat.id)
    if (chatDetails) {
      setActiveChat(chatDetails)
      if (chatDetails.configuration) {
        setSelectedChatConfiguration(chatDetails.configuration)
      }
      // Wait for the chat to be rendered before scrolling
      setTimeout(() => {
        scrollToBottom(false)
      }, 100)
    }
  }

  const pollJobStatus = async (generationId: string) => {
    // Poll job status and update message with imageUrl when ready
    let interval: ReturnType<typeof setInterval> | null = null
    const poll = async () => {
      const status = await api.getJobStatus(generationId)
      if (status?.url) {
        setActiveChat(chat => {
          if (!chat) return null
          setBackgroundProcessingMessage('')
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: `${Date.now()}`,
                role: 'assistant',
                content: '',
                imageUrl: status.url || undefined,
                attachmentIds: [],
              },
            ],
          }
        })
        if (interval) clearInterval(interval)
      }
    }
    interval = setInterval(poll, 2000)
    await poll()
  }

  const onMessage = async (
    message: string,
    attachments?: AttachmentFile[],
    thinkModel?: boolean
  ): Promise<boolean> => {
    // If it's a new chat, need to "cache" new messages, and create a new activeChat once chat_id is streamed in response

    // Extract file IDs from uploaded attachments
    const attachmentIds = attachments?.map(att => att.uploadedFileId!).filter(Boolean)
    // If new chat and configuration enabled, use it
    const chatConfigurationId = selectedChatConfiguration ? selectedChatConfiguration.id : null
    const newMessages: Message[] = []
    const inputMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: message,
      attachmentIds: attachmentIds,
    }
    newMessages.push(inputMessage)

    if (errorMessage) {
      // Remove the user message that caused an error
      popMessage()
      setErrorMessage('')
    }
    addMessage(inputMessage)
    scrollToBottom()

    posthog.capture(EVENTS.MESSAGE_SENT, {
      think_mode_enabled: thinkModel || false,
      character_enabled: !!activeChat?.configuration?.id,
      web_search_performed: false, // TODO: Add web search support
      generate_content_created: false, // TODO: Add content generation support
      hasAttachments: !!attachmentIds?.length,
      attachmentCount: attachmentIds?.length || 0,
    })

    try {
      const assistantMessage: Message = {
        id: `${Date.now()}`,
        role: 'assistant',
        content: '',
      }
      newMessages.push(assistantMessage)
      addMessage(assistantMessage)

      let content = ''
      let isActiveChatSet = !!activeChat
      const onChunk = (chunk: ChatChunk) => {
        if (!isActiveChatSet && chunk.chat_id) {
          const newChat: Chat = {
            id: chunk.chat_id,
            title: inputMessage.content.slice(0, 30),
            createdAt: Math.round(Date.now() / 1000),
          }
          setActiveChat({
            ...newChat,
            messages: newMessages,
            configuration: chatConfigurationId ? selectedChatConfiguration || null : null,
          })
          addChat(newChat)
          isActiveChatSet = true
        } else if (chunk.content) {
          setBackgroundProcessingMessage('')
          content += chunk.content
          updateLastMessage(content)
        } else if (chunk.error) {
          setBackgroundProcessingMessage('')
          setErrorMessage(chunk.error)
          popMessage()
          posthog.capture(EVENTS.MESSAGE_ERROR, { error: chunk.error })
        } else if (chunk.background_processing) {
          setBackgroundProcessingMessage(chunk.background_processing)
        } else if (chunk.generation_message && chunk.generation_id) {
          setBackgroundProcessingMessage(chunk.generation_message)
          // Find the index of the last message (the assistant message)
          pollJobStatus(chunk.generation_id)
        }
        // Whatever other chunks we get
      }

      await api.streamChatResponse(
        {
          chatId: activeChat?.id || null,
          configurationId: chatConfigurationId,
          message,
          attachmentIds,
          thinkModel,
        },
        onChunk,
        () => {
          console.log('Stream finished')
          posthog.capture(EVENTS.MESSAGE_RESPONSE_COMPLETED, {
            hasAttachments: !!attachmentIds?.length,
            attachmentCount: attachmentIds?.length || 0,
            thinkModel: thinkModel || false,
          })
        },
        (err: Error) => {
          console.error('Streaming error:', err)
          posthog.capture(EVENTS.MESSAGE_ERROR, { error: err.message })
        }
      )

      return true
    } catch (err: unknown) {
      console.error('Streaming error:', err)
      posthog.capture(EVENTS.MESSAGE_ERROR, {
        error: err instanceof Error ? err.message : String(err),
      })
      return false
    }
  }

  const addMessage = (message: Message) => {
    if (activeChat) {
      setActiveChat(chat => {
        if (!chat) return null
        const messages = chat.messages
        chat.messages.push(message)
        return {
          ...chat,
          messages,
        }
      })
    } else {
      setMessages(messages => {
        messages.push(message)
        return messages
      })
    }
  }

  const popMessage = (): void => {
    setMessages(messages => {
      if (messages) {
        messages.pop()
      }
      return messages
    })
  }

  const updateLastMessage = (newContent: string) => {
    setActiveChat(chat => {
      if (!chat) return null
      return {
        ...chat,
        messages: [
          ...chat.messages.slice(0, -1),
          {
            ...chat.messages.at(-1)!,
            content: newContent,
          },
        ],
      }
    })
  }

  if (typeof window !== 'undefined') {
    ;(window as any).setFullscreenImage = setFullscreenImage
  }

  return (
    <ThemedView className="flex-1 px-2">
      <NewChatModal isVisible={isNewChatModalOpen} onNewChat={onNewChat} />
      <View className="absolute z-10 flex w-full flex-row items-center justify-between bg-transparent px-2 pb-4 pt-8">
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())} />
        <Pressable onPress={onConfigureNewChat}>
          <NewChatIcon />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 10}
      >
        <ThemedView className="flex-1 pt-14">
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16 }}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToBottom(false)}
          >
            {messages.map((m, i) => (
              <ThemedView key={`msg-${i}`} className="w-full">
                <ChatMessage
                  message={m}
                  configuration={
                    activeChat ? activeChat.configuration : selectedChatConfiguration || null
                  }
                  setFullscreenImage={setFullscreenImage}
                />
              </ThemedView>
            ))}

            {errorMessage && (
              <ThemedView className="w-full">
                <ErrorMessage error={errorMessage} />
              </ThemedView>
            )}

            {backgroundProcessingMessage && (
              <BackgroundProcessingMessage message={backgroundProcessingMessage} />
            )}
          </ScrollView>

          <ThemedChatInput
            onMessage={onMessage}
            placeholder="Message"
            className="px-4 py-2"
            style={{ fontSize: 16 }}
          />
        </ThemedView>
      </KeyboardAvoidingView>
      <Modal visible={!!fullscreenImage} transparent={true} animationType="fade">
        <ThemedView className="flex-1 items-center justify-center">
          <TouchableOpacity
            style={{ position: 'absolute', top: insets.top + 12, right: 16, zIndex: 20 }}
            onPress={() => setFullscreenImage(null)}
          >
            <ThemedText style={{ fontSize: 32 }}>×</ThemedText>
          </TouchableOpacity>
          {fullscreenImage && (
            <>
              <Image
                source={{ uri: fullscreenImage }}
                style={{ width: '90%', aspectRatio: 1, maxHeight: '70%', resizeMode: 'contain' }}
              />
              <TouchableOpacity
                className="mt-4 rounded-lg bg-gray-800 p-3"
                onPress={async () => {
                  try {
                    const { status } = await MediaLibrary.requestPermissionsAsync()
                    if (status !== 'granted') {
                      alert('Permission to access gallery is required!')
                      return
                    }
                    // Download image to a local file
                    const fileUri = FileSystem.cacheDirectory + 'downloaded_image.jpg'
                    await FileSystem.downloadAsync(fullscreenImage, fileUri)
                    await MediaLibrary.saveToLibraryAsync(fileUri)
                    alert('Image saved to gallery!')
                  } catch (e) {
                    alert('Failed to save image: ' + e)
                  }
                }}
              >
                <ThemedText style={{ color: 'white' }}>Save to Gallery</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      </Modal>
    </ThemedView>
  )
}
