import { ThemedView } from '@/components/ThemedView'
import { Chat } from '@/components/chat/Chat'

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 pt-12">
      <Chat />
    </ThemedView>
  )
}
