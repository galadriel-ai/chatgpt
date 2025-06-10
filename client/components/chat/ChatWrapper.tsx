import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedChatInput } from '@/components/theme/ThemedChatInput'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { NewChatIcon, RoleAssistantIcon, RoleUserIcon, SideBarIcon } from '@/components/icons/Icons'
import { useChat } from '@/context/ChatContext'
import { ThemedText } from '@/components/theme/ThemedText'
import { useEffect, useRef, useState } from 'react'
import { Chat, Message } from '@/types/chat'
import { api, ChatChunk } from '@/lib/api'
import { AttachmentFile } from '@/hooks/useMediaAttachments'

import { useRouter } from 'expo-router'

export function ChatWrapper() {
  const navigation = useNavigation()
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)

  const { selectedChat, setSelectedChat, activeChat, setActiveChat, addChat } = useChat()
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (selectedChat && !activeChat) {
      getChatDetails(selectedChat)
    } else if (!selectedChat && !activeChat) {
      setMessages([])
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

  const onNewChat = () => {
    setSelectedChat(null)
    setActiveChat(null)
    router.push('/')
  }

  const getChatDetails = async (chat: Chat): Promise<void> => {
    const chatDetails = await api.getChatDetails(chat.id)
    if (chatDetails) {
      setActiveChat(chatDetails)
      // Wait for the chat to be rendered before scrolling
      setTimeout(() => {
        scrollToBottom(false)
      }, 100)
    }
  }

  const onMessage = async (message: string, attachments?: AttachmentFile[]): Promise<boolean> => {
    // If it's a new chat, need to "cache" new messages, and create a new activeChat once chat_id is streamed in response

    // Extract file IDs from uploaded attachments
    const attachmentIds = attachments?.map(att => att.uploadedFileId!).filter(Boolean)
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
          })
          addChat(newChat)
        } else if (chunk.content) {
          content += chunk.content
          updateLastMessage(content)
        } else if (chunk.error) {
          setErrorMessage(chunk.error)
          popMessage()
        }
        // Whatever other chunks we get
      }

      api.streamChatResponse(
        {
          chatId: activeChat?.id || null,
          message,
          attachmentIds,
        },
        onChunk,
        () => {
          console.log('Stream finished')
        },
        err => {
          console.error('Streaming error:', err)
        }
      )

      return true
    } catch (err) {
      console.error('Streaming error:', err)
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

  return (
    <ThemedView className="flex-1 px-2">
      <ThemedView className="flex w-full flex-row items-center justify-between px-2 pb-4 pt-8">
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())} />
        <Pressable onPress={onNewChat}>
          <NewChatIcon />
        </Pressable>
      </ThemedView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <ThemedView className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16 }}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m, i) => (
              <ThemedView key={`msg-${i}`} className="w-full">
                <ChatMessage message={m} />
              </ThemedView>
            ))}

            {errorMessage && (
              <ThemedView className="w-full">
                <ErrorMessage error={errorMessage} />
              </ThemedView>
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
    </ThemedView>
  )
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'system') return null

  const role = message.role === 'user' ? 'You' : 'Your Sidekik'

  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        {message.role === 'user' ? <RoleUserIcon /> : <RoleAssistantIcon />}
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">{role}</ThemedText>
        <ThemedText>{message.content}</ThemedText>
        {message.attachmentIds && message.attachmentIds.length > 0 && (
          <ThemedView className="mt-2">
            <ThemedText className="text-sm opacity-70">
              📎 {message.attachmentIds.length} attachment
              {message.attachmentIds.length > 1 ? 's' : ''}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  )
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        <RoleAssistantIcon />
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">Your Sidekik</ThemedText>
        <ThemedText lightColor={'#fc161a'} darkColor={'#fc161a'}>
          Error: {error}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  )
}
