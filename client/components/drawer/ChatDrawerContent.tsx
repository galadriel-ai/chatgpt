import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable, Image, View } from 'react-native'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/theme/ThemedText'
import { Chat } from '@/types/chat'
import { Colors } from '@/constants/Colors'
import { ThemedView } from '@/components/theme/ThemedView'
import { useState } from 'react'
import { ChatConfigurationModal } from '@/components/configuration/ChatConfigurationModal'
import { ThemedButton } from '@/components/theme/ThemedButton'
import { api } from '@/lib/api'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { chats, selectedChat, setSelectedChat, setActiveChat } = useChat()
  const { user, logout } = useAuth()
  const router = useRouter()

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const onSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setActiveChat(null)
    router.push(`/(main)/chat/${chat.id}`)
  }

  const onConfigureChats = async () => {
    setIsModalVisible(true)
  }

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      if (user?.accessToken) {
        await api.logout(user.accessToken, user.refreshToken)
      }
      // Clear local state and redirect
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if the backend call fails, we should still clear local state
      await logout()
    }
  }

  return (
    <View className="flex-1">
      <ChatConfigurationModal isVisible={isModalVisible} setIsVisible={setIsModalVisible} />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 46 }}
      >
        <View className="flex flex-row justify-between pt-8">
          <ThemedButton title={'Customize character'} onPress={onConfigureChats} />
        </View>
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
            <ThemedView
              className="h-10 w-10 items-center justify-center rounded-full"
              lightColor={Colors.light.border}
              darkColor={Colors.dark.border}
            >
              <ThemedText className="text-lg text-white">
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </ThemedText>
            </ThemedView>
          )}
          <ThemedText>{user?.name ?? 'Sidekik User'}</ThemedText>
        </ThemedView>
        <Pressable
          onPress={handleLogout}
          className="mt-4 rounded-lg bg-red-500 px-4 py-2"
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText className="text-center text-white">Logout</ThemedText>
        </Pressable>
      </View>
    </View>
  )
}
