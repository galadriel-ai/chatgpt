import { Pressable, View, Text } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import {Colors} from "@/constants/Colors";

export function ThinkButton({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  const textColor = useThemeColor({
    dark: Colors.dark.text
  }, 'textSecondary')
  const backgroundColor = isActive ? '#4A90E2' : 'transparent'

  return (
    <Pressable onPress={onClick}>
      <View
        className="rounded-full border px-3 py-2"
        style={{
          backgroundColor,
          borderColor: useThemeColor({}, 'border'),
          borderWidth: 1,
          opacity: isActive ? 0.8 : 1,
        }}
      >
        <Text
          style={{
            color: isActive ? '#FFFFFF' : textColor,
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          Think
        </Text>
      </View>
    </Pressable>
  )
}
