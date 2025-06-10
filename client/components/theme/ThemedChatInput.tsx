import { useState } from 'react'
import { TextInput, TextInputProps, View } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'
import { ThemedView } from '@/components/theme/ThemedView'
import { PlusIcon, UpArrowIcon } from '@/components/icons/Icons'
import { AttachmentMenu } from '@/components/chat/AttachmentMenu'
import { AttachmentPreview } from '@/components/chat/AttachmentPreview'
import { AttachmentFile, useMediaAttachments } from '@/hooks/useMediaAttachments'
import { useFileUpload } from '@/hooks/useFileUpload'

export type ThemedTextInputProps = TextInputProps & {
  onMessage: (message: string, attachments?: AttachmentFile[]) => Promise<boolean>
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
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])

  const { pickFiles, takePhoto, pickPhotos } = useMediaAttachments()
  const { uploadFile } = useFileUpload()

  const startUpload = async (file: AttachmentFile) => {
    const abortController = new AbortController()

    // Add abort controller to the file
    setAttachments(prev =>
      prev.map(att => (att.id === file.id ? { ...att, abortController } : att))
    )

    try {
      const fileId = await uploadFile(
        { uri: file.uri, name: file.name, type: file.type, size: file.size },
        progress => {
          setAttachments(prev => prev.map(att => (att.id === file.id ? { ...att, progress } : att)))
        },
        abortController.signal
      )

      if (fileId) {
        setAttachments(prev =>
          prev.map(att =>
            att.id === file.id ? { ...att, progress: 100, uploadedFileId: fileId } : att
          )
        )
      } else {
        setAttachments(prev =>
          prev.map(att => (att.id === file.id ? { ...att, error: 'Upload failed' } : att))
        )
      }
    } catch (error) {
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        // Remove the attachment if it was cancelled
        setAttachments(prev => prev.filter(att => att.id !== file.id))
      } else {
        setAttachments(prev =>
          prev.map(att => (att.id === file.id ? { ...att, error: 'Upload failed' } : att))
        )
      }
    }
  }

  const onSubmitClick = async () => {
    const uploadedAttachments = attachments.filter(att => att.uploadedFileId && !att.error)
    if (inputValue.trim() || uploadedAttachments.length > 0) {
      if (await onMessage(inputValue, uploadedAttachments)) {
        setInputValue('')
        setAttachments([])
      } else {
        // TODO error?
      }
    }
  }

  const onPlusClick = () => {
    setShowAttachmentMenu(true)
  }

  const onSelectFiles = async () => {
    const files = await pickFiles()
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files])
      // Start uploading immediately
      files.forEach(startUpload)
    }
  }

  const onSelectCamera = async () => {
    const photo = await takePhoto()
    if (photo) {
      setAttachments(prev => [...prev, photo])
      // Start uploading immediately
      startUpload(photo)
    }
  }

  const onSelectPhotos = async () => {
    const photos = await pickPhotos()
    if (photos.length > 0) {
      setAttachments(prev => [...prev, ...photos])
      // Start uploading immediately
      photos.forEach(startUpload)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const attachment = prev[index]
      // Cancel upload if in progress
      if (attachment.abortController && attachment.progress < 100) {
        attachment.abortController.abort()
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <>
      <ThemedView className="flex flex-col gap-2">
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

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
            <View
              className="flex aspect-square flex-row items-center justify-center gap-4 rounded-full"
              style={{ borderWidth: 1, borderColor }}
            >
              <PlusIcon onClick={onPlusClick} />
            </View>
            <View className="flex flex-row gap-4">
              <UpArrowIcon onClick={onSubmitClick} />
            </View>
          </View>
        </ThemedView>
      </ThemedView>

      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelectFiles={onSelectFiles}
        onSelectCamera={onSelectCamera}
        onSelectPhotos={onSelectPhotos}
      />
    </>
  )
}
