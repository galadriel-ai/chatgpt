import { ThemedView } from '@/components/theme/ThemedView'
import { ChatWrapper } from '@/components/chat/ChatWrapper'
import { useChat } from '@/context/ChatContext'
import { useEffect } from 'react'

export default function HomeScreen() {
  const { chats } = useChat()

  useEffect(() => {
    console.log(chats)
  }, [chats])

  return (
    <ThemedView className="flex-1 pt-12">
      <ChatWrapper />
    </ThemedView>
  )
}
