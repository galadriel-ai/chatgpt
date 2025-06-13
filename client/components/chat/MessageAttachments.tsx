import React from 'react'
import { View, Image, Pressable } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'

interface MessageAttachment {
  name: string
  type: string
  uri: string
  size?: number
}

interface MessageAttachmentsProps {
  attachments: MessageAttachment[]
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary')
  const borderColor = useThemeColor({}, 'border')

  if (!attachments || attachments.length === 0) return null

  const formatFileSize = (size?: number) => {
    if (!size) return ''
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / (1024 * 1024)).toFixed(1)}MB`
  }

  const isImage = (type: string) => type.startsWith('image/')

  const getFileIcon = (type: string) => {
    if (type.includes('zip') || type.includes('archive')) return '📦'
    if (type.includes('pdf')) return '📄'
    if (type.includes('doc')) return '📝'
    if (type.includes('excel') || type.includes('sheet')) return '📊'
    if (type.includes('video')) return '🎥'
    if (type.includes('audio')) return '🎵'
    return '📎'
  }

  return (
    <View className="mt-3 gap-2">
      {attachments.map((attachment, index) => (
        <Pressable
          key={index}
          className="overflow-hidden rounded-lg"
          style={{
            borderColor,
            borderWidth: 1,
            backgroundColor,
          }}
        >
          {isImage(attachment.type) ? (
            <View className="relative">
              <Image source={{ uri: attachment.uri }} className="h-48 w-full" resizeMode="cover" />
              <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                <ThemedText className="text-sm font-medium text-white">
                  {attachment.name}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-3 p-3">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                <ThemedText className="text-2xl">{getFileIcon(attachment.type)}</ThemedText>
              </View>
              <View className="flex-1">
                <ThemedText className="text-sm font-medium" numberOfLines={2}>
                  {attachment.name}
                </ThemedText>
                {attachment.size && (
                  <ThemedText className="mt-1 text-xs opacity-60">
                    {formatFileSize(attachment.size)}
                  </ThemedText>
                )}
              </View>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  )
}
