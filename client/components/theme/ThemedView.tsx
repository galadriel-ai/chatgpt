import React, { forwardRef } from 'react'
import { View, type ViewProps } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedViewProps = ViewProps & {
  lightColor?: string
  darkColor?: string
  variant?: 'card' | 'container' | 'section'
  className?: string
}

function ThemedViewBase(
  { style, lightColor, darkColor, variant, className, ...otherProps }: ThemedViewProps,
  ref: React.Ref<View>
) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')

  const variantClasses = {
    card: 'rounded-lg p-4 shadow-sm',
    container: 'flex-1 p-4',
    section: 'my-2 p-4 rounded-md',
  }

  const combinedClassName = variant
    ? `${variantClasses[variant]} ${className || ''}`.trim()
    : className

  return (
    <View
      ref={ref}
      className={combinedClassName}
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  )
}

const ThemedView = forwardRef(ThemedViewBase) as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ThemedViewProps> & React.RefAttributes<View>
>

ThemedView.displayName = 'ThemedView'
export { ThemedView }
