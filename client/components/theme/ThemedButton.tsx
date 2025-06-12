import {Button, ButtonProps} from 'react-native'

import {useThemeColor} from '@/hooks/useThemeColor'

export type ThemedButtonProps = ButtonProps & {
  lightColor?: string
  darkColor?: string
}

export function ThemedButton(
  {
    title,
    onPress,
    lightColor,
    darkColor,
  }: ThemedButtonProps) {
  const color = useThemeColor({light: lightColor, dark: darkColor}, 'text')
  return (
    <Button
      title={title}
      onPress={onPress}
      color={color}
    />
  )
}
