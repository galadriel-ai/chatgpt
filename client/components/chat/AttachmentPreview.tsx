import React from 'react'
import { View, ScrollView, Pressable, Image, Text } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { AttachmentFile } from '@/hooks/useMediaAttachments'
import { CircularProgress } from '@/components/ui/CircularProgress'

interface AttachmentPreviewProps {
  attachments: AttachmentFile[]
  onRemove: (index: number) => void
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  const borderColor = useThemeColor({}, 'border')
  const backgroundColor = useThemeColor({}, 'backgroundSecondary')

  if (attachments.length === 0) return null

  const formatFileSize = (size?: number) => {
    if (!size) return ''
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / (1024 * 1024)).toFixed(1)}MB`
  }

  const isImage = (type: string) => type.startsWith('image/')

  return (
    <ThemedView className="mb-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="gap-2"
        contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
      >
        {attachments.map((attachment, index) => (
          <View
            key={index}
            className="relative rounded-lg overflow-hidden"
            style={{ 
              borderColor, 
              borderWidth: 1,
              backgroundColor,
              width: 80,
              height: 60
            }}
          >
            {isImage(attachment.type) ? (
              <Image
                source={{ uri: attachment.uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <ThemedView className="w-full h-full justify-center items-center p-2">
                <ThemedText className="text-xs font-medium text-center" numberOfLines={2}>
                  {attachment.name}
                </ThemedText>
                {attachment.size && (
                  <ThemedText className="text-xs opacity-60 mt-1">
                    {formatFileSize(attachment.size)}
                  </ThemedText>
                )}
              </ThemedView>
            )}
            
                          {/* Upload progress overlay */}
              {attachment.progress < 100 && !attachment.error && (
                <View className="absolute inset-0 bg-black/50 justify-center items-center">
                  <CircularProgress 
                    size={40}
                    strokeWidth={3}
                  />
                </View>
              )}
            
            {/* Error overlay */}
            {attachment.error && (
              <View className="absolute inset-0 bg-red-500/70 justify-center items-center">
                <ThemedText className="text-white text-xs font-bold">✕</ThemedText>
              </View>
            )}
            
                          {/* Remove button - only show when upload is complete or failed */}
              {(attachment.progress >= 100 || attachment.error) && (
                <Pressable
                  onPress={() => onRemove(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full justify-center items-center"
                >
                  <Text style={{ color: '#000000', fontSize: 12, fontWeight: 'bold' }}>×</Text>
                </Pressable>
              )}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  )
} 