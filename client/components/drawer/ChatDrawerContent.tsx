import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable } from 'react-native'
import { useChat } from '@/context/ChatContext'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedView } from '@/components/theme/ThemedView'
import { Chat } from '@/types/chat'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { chats, setSelectedChat, setActiveChat } = useChat()
  const router = useRouter()

  const onSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setActiveChat(null)
    router.push(`/(main)/chat/${chat.id}`)
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <ThemedView className="h-full flex-1 justify-between">
        <ThemedView className="p-4">
          {chats.map(chat => (
            <Pressable key={chat.id} onPress={() => onSelectChat(chat)} className="mb-2">
              <ThemedText className="text-base">{chat.title ?? 'Untitled Chat'}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
        <ThemedView className="w-full p-4">
          <ThemedText>User Name</ThemedText>
        </ThemedView>
      </ThemedView>
    </DrawerContentScrollView>
  )
}
