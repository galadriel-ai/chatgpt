import {DrawerContentComponentProps, DrawerContentScrollView} from '@react-navigation/drawer'
import {Pressable, View} from 'react-native'
import {useChat} from '@/context/ChatContext'
import {useRouter} from 'expo-router'
import {ThemedText} from '@/components/theme/ThemedText'
import {Chat} from '@/types/chat'

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
      <View className="h-full flex-1 justify-between">
        <View className="p-4">
          {chats.map(chat => (
            <Pressable key={chat.id} onPress={() => onSelectChat(chat)} className="mb-2">
              <ThemedText className="text-base">{chat.title ?? 'Untitled Chat'}</ThemedText>
            </Pressable>
          ))}
        </View>
        <View className="w-full p-4">
          <ThemedText>User Name</ThemedText>
        </View>
      </View>
    </DrawerContentScrollView>
  )
}
