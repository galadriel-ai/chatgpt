import { ChatWrapper } from '@/components/chat/ChatWrapper'
import { ThemedView } from '@/components/theme/ThemedView'

export default function Chat() {
  return (
    <ThemedView className="flex-1 px-2 pb-10 pt-12">
      <ChatWrapper />
    </ThemedView>
  )
}
