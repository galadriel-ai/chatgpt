import { ThemedText } from '@/components/theme/ThemedText'
import { BlurView } from 'expo-blur'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Pressable, View } from 'react-native'
import Osho from '@/assets/characters/osho.svg'
import Dalai from '@/assets/characters/dalai.svg'
import Tony from '@/assets/characters/tony.svg'
import { RoleAssistantIcon } from '@/components/icons/Icons'
import { Colors } from '@/constants/Colors'
import { useChat } from '@/context/ChatContext'
import { ChatConfiguration } from '@/types/chat'
import { CONFIGURATION_DALAI, CONFIGURATION_OSHO, CONFIGURATION_TONY } from '@/constants/Characters'

interface Props {
  isVisible: boolean
  onNewChat: (configuration: ChatConfiguration | null) => void
}

export function NewChatModal({ isVisible, onNewChat }: Props) {
  const theme = useColorScheme() ?? 'light'

  const { chatConfiguration } = useChat()

  const onSelectCharacter = async (configuration: ChatConfiguration | null) => {
    console.log(`Character: ${configuration}`)
    onNewChat(configuration)
  }

  if (!isVisible) return null
  return (
    <BlurView
      intensity={50}
      tint={theme === 'light' ? 'light' : 'dark'}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 9,
      }}
      className="h-screen w-screen"
    >
      <View className="flex flex-col items-center gap-10">
        <View className="w-full text-center">
          <ThemedText variant="heading" className="">
            Pick a character to chat with
          </ThemedText>
        </View>
        <View className="flex w-full flex-row gap-20">
          <Pressable onPress={() => onSelectCharacter(CONFIGURATION_OSHO)}>
            <View className="flex flex-col gap-2">
              <Osho width={100} height={100} />
              <ThemedText className="text-center">Osho</ThemedText>
            </View>
          </Pressable>
          <Pressable onPress={() => onSelectCharacter(CONFIGURATION_DALAI)}>
            <View className="flex flex-col gap-2">
              <Dalai width={100} height={100} />
              <ThemedText className="text-center">Dalai Lama</ThemedText>
            </View>
          </Pressable>
        </View>
        <View className="flex w-full flex-row gap-20">
          <Pressable onPress={() => onSelectCharacter(CONFIGURATION_TONY)}>
            <View className="flex flex-col gap-2">
              <Tony width={100} height={100} />
              <ThemedText className="text-center">Tony Robbins</ThemedText>
            </View>
          </Pressable>
          {chatConfiguration && (
            <Pressable onPress={() => onSelectCharacter(chatConfiguration)}>
              <View className="flex flex-col gap-2">
                <RoleAssistantIcon width={'100'} height={'100'} />
                <ThemedText className="text-center">Custom</ThemedText>
              </View>
            </Pressable>
          )}
        </View>
      </View>
      <View className="pt-20">
        <Pressable onPress={() => onSelectCharacter(null)}>
          <View
            className="rounded-full px-4 py-2"
            style={{ borderWidth: 1, borderColor: Colors.light.border }}
          >
            <ThemedText
              lightColor={Colors.light.textSecondary}
              darkColor={Colors.dark.textSecondary}
            >
              Regular chat
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </BlurView>
  )
}
