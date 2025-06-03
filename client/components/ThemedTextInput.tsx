import { TextInput, TextInputProps } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string
  darkColor?: string
  className?: string
}

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  className,
  ...otherProps
}: ThemedTextInputProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')
  const borderColor = useThemeColor({}, 'border')

  const defaultClasses = ''
  const combinedClassName = `${defaultClasses} ${className || ''}`.trim()

  return (
    <TextInput
      className={combinedClassName}
      style={[{ backgroundColor, color, borderColor, borderWidth: 1 }, style]}
      {...otherProps}
    />
  )
}
