import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedChatInput } from '@/components/theme/ThemedChatInput'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { RoleAssistantIcon, RoleUserIcon, SideBarIcon } from '@/components/icons/Icons'
import { useChat } from '@/context/ChatContext'
import { ThemedText } from '@/components/theme/ThemedText'
import { useEffect, useState, useRef } from 'react'
import { Chat, Message } from '@/types/chat'
import { api, ChatChunk } from '@/lib/api'

export function ChatWrapper() {
  const navigation = useNavigation()
  const scrollViewRef = useRef<ScrollView>(null)

  const { selectedChat, activeChat, setActiveChat, addChat } = useChat()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (selectedChat && !activeChat) {
      getChatDetails(selectedChat)
    }
  }, [selectedChat])

  useEffect(() => {
    if (activeChat) setMessages(activeChat.messages)
  }, [activeChat])

  const scrollToBottom = () => {
    // Wait a tiny bit to make sure the message was rendered
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const getChatDetails = async (chat: Chat): Promise<void> => {
    const chatDetails = await api.getChatDetails(chat.id)
    if (chatDetails) {
      setActiveChat(chatDetails)
    }
  }

  const onMessage = async (message: string): Promise<boolean> => {
    // If it's a new chat, need to "cache" new messages, and create a new activeChat once chat_id is streamed in response
    const newMessages: Message[] = []
    const inputMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: message,
    }
    newMessages.push(inputMessage)
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
        }
        // Whatever other chunks we get
      }

      api.streamChatResponse(
        {
          chatId: activeChat?.id || null,
          message,
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
      <ThemedView className="flex flex-row pt-8">
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())} />
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
    <ThemedView className="flex flex-row gap-4 pt-6">
      <ThemedView className="flex w-8 flex-col items-center">
        {message.role === 'user' ? <RoleUserIcon /> : <RoleAssistantIcon />}
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">{role}</ThemedText>
        <ThemedText>{message.content}</ThemedText>
      </ThemedView>
    </ThemedView>
  )
}
