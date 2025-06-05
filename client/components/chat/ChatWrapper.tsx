import {KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native'
import {ThemedView} from '@/components/theme/ThemedView'
import {ThemedChatInput} from '@/components/theme/ThemedChatInput'
import {DrawerActions, useNavigation} from '@react-navigation/native'
import {RoleAssistantIcon, RoleUserIcon, SideBarIcon} from '@/components/icons/Icons'
import {API_BASE_URL} from '@env'
import {useChat} from '@/context/ChatContext'
import {ThemedText} from '@/components/theme/ThemedText'
import {useEffect} from "react";
import {Chat, Message} from "@/types/chat";
import {api} from "@/lib/api";

export function ChatWrapper() {
  const navigation = useNavigation()

  const {selectedChat, activeChat, setActiveChat} = useChat()

  useEffect(() => {
    if (selectedChat && !activeChat) {
      getChatDetails(selectedChat)
    }
  }, [selectedChat])

  const getChatDetails = async (chat: Chat): Promise<void> => {
    const chatDetails = await api.getChatDetails(chat.id)
    if (chatDetails) {
      setActiveChat(chatDetails)
    }
  }

  const onMessage = async (message: string): Promise<boolean> => {
    // TODO: handle new chats somehow
    // if (!activeChat) return false

    setActiveChat(chat => {
      if (!chat) return null
      const messages = chat.messages
      // TODO: handle nicely somehow
      chat.messages.push({
        id: `${Date.now()}`,
        role: 'user',
        content: message,
      })
      return {
        ...chat,
        messages,
      }
    })

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: activeChat?.id || null,
          content: message
        }),
      })

      if (!res.body) throw new Error('No response body for stream')

      setActiveChat(chat => {
        if (!chat) return null
        const messages = chat.messages
        chat.messages.push({
          id: `${Date.now()}`,
          role: 'assistant',
          content: '',
        })
        return {
          ...chat,
          messages,
        }
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let content = ''

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        try {
          const parsed_chunk = JSON.parse(chunk)
          if (parsed_chunk.content) {
            content += parsed_chunk.content
            // Update the last message incrementally
            updateLastMessage(content)
          }
        } catch {
        }
      }

      return true
    } catch (err) {
      console.error('Streaming error:', err)
      return false
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
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())}/>
      </ThemedView>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <ThemedView className="flex-1">
          <ScrollView
            contentContainerStyle={{padding: 16}}
            style={{flex: 1}}
            keyboardShouldPersistTaps="handled"
          >
            {activeChat?.messages.map((m, i) => (
              <ThemedView
                key={`msg-${i}`}
                className="w-full"
              >
                <ChatMessage message={m}/>
              </ThemedView>
            ))}
          </ScrollView>

          <ThemedChatInput
            onMessage={onMessage}
            placeholder="Message"
            className="px-4 py-2"
            style={{fontSize: 16}}
          />
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

function ChatMessage({message}: { message: Message }) {
  if (message.role === 'system') return null

  const role = message.role === 'user' ?
    'You' : 'Your Sidekik'

  return (
    <ThemedView
      className="flex flex-row gap-4 pt-6"
    >
      <ThemedView
        className="w-8 flex flex-col items-center"
      >
        {message.role === 'user' ?
          <RoleUserIcon/>
          :
          <RoleAssistantIcon/>
        }
      </ThemedView>
      <ThemedView
        className="flex flex-col gap-1 flex-1"
      >
        <ThemedText className="font-bold">{role}</ThemedText>
        <ThemedText>
          {message.content}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  )
}