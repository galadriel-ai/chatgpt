import {DrawerContentComponentProps, DrawerContentScrollView} from '@react-navigation/drawer'
import {Pressable, View} from 'react-native'
import {useChat} from '@/context/ChatContext'
import {useRouter} from 'expo-router'
import {ThemedText} from '@/components/theme/ThemedText'
import {Chat} from '@/types/chat'
import {Colors} from '@/constants/Colors'
import {ThemedView} from '@/components/theme/ThemedView'
import {RoleUserIcon} from '@/components/icons/Icons'

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const {chats, selectedChat, setSelectedChat, setActiveChat} = useChat()
  const router = useRouter()

  const onSelectChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setActiveChat(null)
    router.push(`/(main)/chat/${chat.id}`)
  }

  const onConfigureChats = async () => {
    console.log('onConfigureChats')
  }

  return (
    <View className="flex-1">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{paddingHorizontal: 16, paddingTop: 46}}
      >
        <View className="p-4 flex flex-row justify-between">
          <Pressable onPress={onConfigureChats}>
            <ThemedText>
              Configure chats
            </ThemedText>
          </Pressable>
          <ThemedText>
            ASD
          </ThemedText>
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
      <View className="flex w-full flex-row items-center gap-2 p-4 pb-10">
        <RoleUserIcon/>
        <ThemedText>User Name</ThemedText>
      </View>
    </View>
  )
}
