import {ThemedText} from "@/components/theme/ThemedText";
import {BlurView} from "expo-blur";
import {useColorScheme} from "@/hooks/useColorScheme";
import {Pressable, View} from "react-native";
import Osho from "@/assets/characters/osho.svg";
import Dalai from "@/assets/characters/dalai.svg";
import Tony from "@/assets/characters/tony.svg";
import {RoleAssistantIcon} from "@/components/icons/Icons";
import {Colors} from "@/constants/Colors";

interface Props {
  isVisible: boolean;
}

export function NewChatModal({isVisible}: Props) {
  const theme = useColorScheme() ?? 'light'

  if (!isVisible) return null
  return (
    <BlurView
      intensity={50}
      tint={theme === 'light' ? 'light' : 'dark'}
      style={{flex: 1, justifyContent: "center", alignItems: "center", position: "absolute", zIndex: 9}}
      className="h-screen w-screen"
    >
      <View className="flex flex-col gap-10 items-center">
        <View className="w-full text-center">
          <ThemedText variant="heading" className="">
            Pick a character to chat
          </ThemedText>
        </View>
        <View className="flex flex-row w-full gap-20">
          <View className="flex flex-col gap-2">
            <Osho width={100} height={100}/>
            <ThemedText className="text-center">Osho</ThemedText>
          </View>
          <View className="flex flex-col gap-2">
            <Dalai width={100} height={100}/>
            <ThemedText className="text-center">Dalai Lama</ThemedText>
          </View>
        </View>
        <View className="flex flex-row w-full gap-20">
          <View className="flex flex-col gap-2">
            <Tony width={100} height={100}/>
            <ThemedText className="text-center">Tony Robbins</ThemedText>
          </View>
          <View className="flex flex-col gap-2">
            <RoleAssistantIcon width={"100"} height={"100"}/>
            <ThemedText className="text-center">Custom</ThemedText>
          </View>
        </View>
      </View>
      <View className="pt-20">
        <Pressable>
          <View
            className="rounded-full px-4 py-2"
            style={{borderWidth: 1, borderColor: Colors.light.border}}
          >
            <ThemedText
              lightColor={Colors.light.textSecondary}
              darkColor={Colors.dark.textSecondary}
            >Regular chat</ThemedText>
          </View>
        </Pressable>
      </View>
    </BlurView>
  )
}