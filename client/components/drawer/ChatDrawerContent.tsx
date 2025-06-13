import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable, Image } from 'react-native'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedView } from '@/components/theme/ThemedView'
import { Chat } from '@/types/chat'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { chats, setSelectedChat, setActiveChat } = useChat()
  const { user } = useAuth()
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
          <ThemedView className="flex-row items-center gap-3">
            {user?.profile_picture ? (
              <Image
                source={{ uri: user.profile_picture }}
                className="h-10 w-10 rounded-full"
                alt="Profile picture"
              />
            ) : (
              // A default profile picture with the first letter of the user's name
              <ThemedView className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <ThemedText className="text-lg text-white">
                  {user?.name?.[0]?.toUpperCase() ?? 'G'}
                </ThemedText>
              </ThemedView>
            )}
            <ThemedText>{user?.name ?? 'Guest User'}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </DrawerContentScrollView>
  )
}
