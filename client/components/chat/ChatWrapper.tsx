import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedChatInput } from '@/components/theme/ThemedChatInput'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { SideBarIcon } from '@/components/icons/Icons'
import { API_BASE_URL } from '@env'
import { useChat } from '@/context/ChatContext'
import { ThemedText } from '@/components/theme/ThemedText'

export function ChatWrapper() {
  const navigation = useNavigation()

  const { activeChat, setActiveChat } = useChat()

  const onMessage = async (message: string): Promise<boolean> => {
    const chatId = activeChat?.id
    if (!chatId) return false

    setActiveChat(chat => {
      if (!chat) return null
      const messages = chat.messages
      // TODO: handle nicely somehow
      chat.messages.push({
        id: `${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      })
      return {
        ...chat,
        messages,
      }
    })

    try {
      const res = await fetch(`${API_BASE_URL}/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!res.body) throw new Error('No response body for stream')

      setActiveChat(chat => {
        if (!chat) return null
        const messages = chat.messages
        // TODO: handle nicely somehow
        chat.messages.push({
          id: `${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
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
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        content += chunk

        // Update the last message incrementally
        updateLastMessage(content)
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
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())} />
      </ThemedView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <ThemedView className="flex-1">
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {activeChat?.messages.map((m, i) => (
              <ThemedView key={`msg-${i}`}>
                <ThemedText>{m.content}</ThemedText>
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
