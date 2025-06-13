import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable, Image, View } from 'react-native'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/theme/ThemedText'
import { Chat } from '@/types/chat'
import { Colors } from '@/constants/Colors'
import { ThemedView } from '@/components/theme/ThemedView'
import { RoleUserIcon } from '@/components/icons/Icons'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { chats, selectedChat, setSelectedChat, setActiveChat } = useChat()
  const { user } = useAuth()
  const router = useRouter()

  const onSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setActiveChat(null)
    router.push(`/(main)/chat/${chat.id}`)
  }

  return (
    <View className="flex-1">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 46 }}
      >
        <View className="p-4">
          <ThemedText
            className="mb-2 font-bold"
            lightColor={Colors.light.textSecondary}
            darkColor={Colors.dark.textSecondary}
          >
            {chats && chats.length ? 'Chats' : ''}
          </ThemedText>

          {chats.map(chat => (
            <Pressable key={chat.id} onPress={() => onSelectChat(chat)}>
              {selectedChat && selectedChat.id === chat.id ? (
                <ThemedView
                  className="rounded-lg px-2 py-1"
                  lightColor={Colors.light.backgroundHighlight}
                  darkColor={Colors.dark.backgroundHighlight}
                >
                  <ThemedText className="text-base">{chat.title ?? 'Untitled Chat'}</ThemedText>
                </ThemedView>
              ) : (
                <View className="rounded-lg px-2 py-1">
                  <ThemedText className="text-base">{chat.title ?? 'Untitled Chat'}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        </DrawerContentScrollView>
        <View className="w-full p-4">
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
        </View>
      </View>
  )
}
