import { View, type ViewProps } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedViewProps = ViewProps & {
  lightColor?: string
  darkColor?: string
  variant?: 'card' | 'container' | 'section'
  className?: string
}

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant,
  className,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')

  // Define variant classes for NativeWind
  const variantClasses = {
    card: 'rounded-lg p-4 shadow-sm',
    container: 'flex-1 p-4',
    section: 'my-2 p-4 rounded-md',
  }

  // Combine variant classes with any additional className
  const combinedClassName = variant
    ? `${variantClasses[variant]} ${className || ''}`.trim()
    : className

  return <View className={combinedClassName} style={[{ backgroundColor }, style]} {...otherProps} />
}
