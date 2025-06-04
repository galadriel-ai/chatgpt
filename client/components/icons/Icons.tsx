import Svg, { Path } from 'react-native-svg'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Pressable, View } from 'react-native'

export function UpArrowIcon({ onClick }: { onClick: () => void }) {
  // On purpose inverted
  const color = useThemeColor({}, 'background')
  const background = useThemeColor({}, 'text')

  return (
    <Pressable onPress={onClick}>
      <View className="cursor-pointer rounded-full p-3" style={{ backgroundColor: background }}>
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <Path
            d="M5.99984 12.6667V1M5.99984 1L1 5.83301M5.99984 1L11 5.83301"
            stroke={color}
            strokeOpacity="1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  )
}

export function SideBarIcon({ onClick }: { onClick: () => void }) {
  const color = useThemeColor({}, 'text')

  return (
    <Pressable onPress={onClick}>
      <Svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        <Path
          d="M2 1.5H20M2 8.5H15"
          stroke={color}
          strokeOpacity="1"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  )
}
