import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { RoleAssistantIcon } from '@/components/icons/Icons'
import { ThemedText } from '@/components/theme/ThemedText'

export function BackgroundProcessingMessage({ message }: { message: string }) {
  const shimmerValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    )
    shimmerAnimation.start()
    return () => shimmerAnimation.stop()
  }, [shimmerValue])

  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  })

  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        <RoleAssistantIcon />
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">Your Sidekik</ThemedText>
        <ThemedView style={{ position: 'relative', overflow: 'hidden' }}>
          <ThemedText style={{ opacity: 0.7 }}>{message}</ThemedText>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              transform: [{ translateX: shimmerTranslateX }],
              width: 100,
            }}
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  )
}
