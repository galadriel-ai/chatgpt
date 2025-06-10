import React, { useEffect } from 'react'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { useThemeColor } from '@/hooks/useThemeColor'

interface CircularProgressProps {
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}

export function CircularProgress({ 
  size = 50, 
  strokeWidth = 4,
  children 
}: CircularProgressProps) {
  const color = useThemeColor({}, 'text')
  const rotation = useSharedValue(0)
  
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Show about 25% of the circle for the spinner effect
  const strokeDasharray = `${circumference * 0.25} ${circumference * 0.75}`

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    )
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  return (
    <View style={{ width: size, height: size }} className="relative justify-center items-center">
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Spinning progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFFFFF" // White color
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </Animated.View>
      {children}
    </View>
  )
} 