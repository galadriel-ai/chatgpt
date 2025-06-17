import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { RoleAssistantIcon } from '@/components/icons/Icons'
import { ThemedText } from '@/components/theme/ThemedText'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useThemeColor } from '@/hooks/useThemeColor'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

export function BackgroundProcessingMessage({ message }: { message: string }) {
  const shimmerValue = useRef(new Animated.Value(0)).current
  const isDarkMode = useColorScheme() === 'dark'

  const textColor = useThemeColor({ light: '#111', dark: '#fff' }, 'text')

  const shimmerColors: [string, string, string] = isDarkMode
    ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']
    : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    shimmerAnimation.start()
    return () => shimmerAnimation.stop()
  }, [shimmerValue])

  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  })

  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        <RoleAssistantIcon />
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">Your Sidekik</ThemedText>
        <MaskedView
          maskElement={
            <ThemedText style={{ opacity: 0.9, fontWeight: 'normal', color: textColor }}>
              {message}
            </ThemedText>
          }
        >
          <Animated.View
            style={{
              width: 300,
              height: 20,
              transform: [{ translateX: shimmerTranslateX }],
            }}
          >
            <LinearGradient
              colors={shimmerColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </MaskedView>
      </ThemedView>
    </ThemedView>
  )
}
