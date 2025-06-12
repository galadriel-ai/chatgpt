import React from 'react'
import {TextInput, TextInputProps} from 'react-native'

import {useThemeColor} from '@/hooks/useThemeColor'
import {ThemedView} from '@/components/theme/ThemedView'


export type ThemedTextInputProps = TextInputProps & {
  value: string
  onUpdate: (value: string) => void
  className?: string
  ref?: React.Ref<TextInput>
}

export function ThemedChatInput(
  {
    value,
    onUpdate,
    style,
    className,
    placeholder,
    ref,
    ...otherProps
  }: ThemedTextInputProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary')
  const color = useThemeColor({}, 'text')
  const borderColor = useThemeColor({}, 'border')
  const placeholderColor = useThemeColor({}, 'light')

  const defaultClasses = ''
  const combinedClassName = `${defaultClasses} ${className || ''}`.trim()


  return (
    <ThemedView className="flex flex-col gap-2">
      <ThemedView
        className="flex flex-col gap-2 rounded-2xl px-2 py-2"
        style={[{backgroundColor, borderColor, borderWidth: 1}]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onUpdate}
          className={combinedClassName}
          style={[{color}, style]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          multiline={true}
          {...otherProps}
        />
      </ThemedView>
    </ThemedView>
  )
}
