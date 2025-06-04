import { TextInput, TextInputProps, View } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'
import { ThemedView } from '@/components/theme/ThemedView'
import { UpArrowIcon } from '@/components/icons/Icons'
import { useState } from 'react'

export type ThemedTextInputProps = TextInputProps & {
  onMessage: (message: string) => boolean
  className?: string
}

export function ThemedChatInput({
  onMessage,
  style,
  className,
  ...otherProps
}: ThemedTextInputProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary')
  const color = useThemeColor({}, 'text')
  const borderColor = useThemeColor({}, 'border')
  const placeholderColor = useThemeColor({}, 'light')

  const defaultClasses = ''
  const combinedClassName = `${defaultClasses} ${className || ''}`.trim()

  const [inputValue, setInputValue] = useState<string>('')

  const onSubmitClick = () => {
    if (inputValue) {
      if (onMessage(inputValue)) {
        setInputValue('')
      } else {
        // TODO error?
      }
    }
  }

  return (
    <ThemedView
      className="flex flex-col gap-2 rounded-2xl px-2 py-2"
      style={[{ backgroundColor, borderColor, borderWidth: 1 }]}
    >
      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        className={combinedClassName}
        style={[{ color }, style]}
        placeholderTextColor={placeholderColor}
        {...otherProps}
      />
      <View className="flex flex-row justify-between">
        <View className="flex flex-row gap-4"></View>
        <View className="flex flex-row gap-4">
          <UpArrowIcon onClick={onSubmitClick} />
        </View>
      </View>
    </ThemedView>
  )
}
