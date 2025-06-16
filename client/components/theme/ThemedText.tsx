import { StyleSheet, Text, type TextProps } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedTextProps = TextProps & {
  lightColor?: string
  darkColor?: string
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'
  variant?: 'heading' | 'body' | 'label' | 'caption'
  className?: string
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant,
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')

  // Define variant classes for NativeWind
  const variantClasses = {
    heading: 'text-2xl font-bold',
    body: 'text-base',
    label: 'text-sm font-medium',
    caption: 'text-xs text-gray-500',
  }

  // Combine variant classes with any additional className
  const combinedClassName = variant
    ? `${variantClasses[variant]} ${className || ''}`.trim()
    : className

  // Map variant to type if only variant is provided
  const effectiveType = variant
    ? {
        heading: 'title',
        body: 'default',
        label: 'defaultSemiBold',
        caption: 'default',
      }[variant]
    : type

  return (
    <Text
      className={combinedClassName}
      style={[
        { color },
        effectiveType === 'default' ? ThemedTextStyles.default : undefined,
        effectiveType === 'title' ? ThemedTextStyles.title : undefined,
        effectiveType === 'defaultSemiBold' ? ThemedTextStyles.defaultSemiBold : undefined,
        effectiveType === 'subtitle' ? ThemedTextStyles.subtitle : undefined,
        effectiveType === 'link' ? ThemedTextStyles.link : undefined,
        style,
      ]}
      {...rest}
    />
  )
}

export const ThemedTextStyles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
})
