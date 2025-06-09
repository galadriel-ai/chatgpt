import { ThemedView } from '@/components/theme/ThemedView'
import { ChatWrapper } from '@/components/chat/ChatWrapper'

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 px-2 pb-10 pt-12">
      <ChatWrapper />
    </ThemedView>
  )
}
