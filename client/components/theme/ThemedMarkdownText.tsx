import { Platform, TextStyle } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useThemeColor } from '@/hooks/useThemeColor'
import { ThemedTextProps, ThemedTextStyles } from './ThemedText'

export type ThemedMarkdownTextProps = Omit<ThemedTextProps, 'type' | 'variant'> & {
  content: string
}

export function ThemedMarkdownText({
  style,
  lightColor,
  darkColor,
  className,
  content,
  ...rest
}: ThemedMarkdownTextProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text')
  const backgroundColor = useThemeColor({}, 'background')

  const markdownStyles: Record<string, TextStyle> = {
    body: {
      ...ThemedTextStyles.default,
      color: textColor,
    },
    heading1: {
      ...ThemedTextStyles.title,
      color: textColor,
      marginVertical: 8,
    },
    heading2: {
      ...ThemedTextStyles.subtitle,
      color: textColor,
      marginVertical: 8,
    },
    heading3: {
      ...ThemedTextStyles.defaultSemiBold,
      color: textColor,
      marginVertical: 8,
    },
    link: {
      ...ThemedTextStyles.link,
    },
    code_inline: {
      ...ThemedTextStyles.default,
      backgroundColor: backgroundColor,
      padding: 4,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    code_block: {
      ...ThemedTextStyles.default,
      backgroundColor: backgroundColor,
      padding: 8,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginVertical: 8,
    },
    blockquote: {
      ...ThemedTextStyles.default,
      borderLeftWidth: 4,
      borderLeftColor: textColor,
      paddingLeft: 8,
      marginVertical: 8,
      opacity: 0.8,
    },
    list_item: {
      ...ThemedTextStyles.default,
      marginVertical: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    strong: {
      ...ThemedTextStyles.defaultSemiBold,
      color: textColor,
    },
    em: {
      ...ThemedTextStyles.default,
      color: textColor,
      fontStyle: 'italic' as const,
    },
  }

  return <Markdown style={markdownStyles}>{content}</Markdown>
}
