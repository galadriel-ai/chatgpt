import { TextInput, TextInputProps } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'

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
  const placeholderColor = useThemeColor({}, 'light')

  const defaultClasses = ''
  const combinedClassName = `${defaultClasses} ${className || ''}`.trim()

  return (
    <ThemedView
      className="flex flex-col gap-2 rounded-2xl px-1 py-2"
      style={[{ backgroundColor, borderColor, borderWidth: 1 }]}
    >
      <TextInput
        className={combinedClassName}
        style={[{ color }, style]}
        placeholderTextColor={placeholderColor}
        {...otherProps}
      />
      <ThemedView className="flex flex-row">
        <ThemedText>extra stuff</ThemedText>
      </ThemedView>
    </ThemedView>
  )
}
