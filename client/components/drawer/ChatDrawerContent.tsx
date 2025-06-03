import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable } from 'react-native'
import { useChat } from '@/context/ChatContext'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedView } from '@/components/theme/ThemedView'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { chats, setActiveChat } = useChat()
  const router = useRouter()

  return (
    <DrawerContentScrollView {...props}>
      <ThemedView className="p-4">
        {chats.map(chat => (
          <Pressable
            key={chat.id}
            onPress={() => {
              setActiveChat(chat)
              router.push(`/(main)/chat/${chat.id}`)
            }}
            className="mb-2"
          >
            <ThemedText className="text-base">{chat.title ?? 'Untitled Chat'}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>
    </DrawerContentScrollView>
  )
}
