import React, {useState} from 'react'
import {Alert, TextInput, TextInputProps, View} from 'react-native'

import {useThemeColor} from '@/hooks/useThemeColor'
import {ThemedView} from '@/components/theme/ThemedView'
import {PlusIcon, UpArrowIcon} from '@/components/icons/Icons'
import {ThinkButton} from '@/components/buttons/buttons'
import {AttachmentMenu} from '@/components/chat/AttachmentMenu'
import {AttachmentPreview} from '@/components/chat/AttachmentPreview'
import {AttachmentFile, useMediaAttachments} from '@/hooks/useMediaAttachments'
import {useFileUpload} from '@/hooks/useFileUpload'

const MAX_FILES_COUNT_PER_MESSAGE = 5

export type ThemedTextInputProps = TextInputProps & {
  onMessage: (
    message: string,
    attachments?: AttachmentFile[],
    thinkModel?: boolean
  ) => Promise<boolean>
  className?: string
}

export function ThemedChatInput(
  {
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

  const {pickFiles, takePhoto, pickPhotos} = useMediaAttachments()
  const {uploadFile} = useFileUpload()
  const [thinkModel, setThinkModel] = useState<boolean>(false)

  const startUpload = async (file: AttachmentFile) => {
    const abortController = new AbortController()

    // Add abort controller to the file
    setAttachments(prev =>
      prev.map(att => (att.id === file.id ? {...att, abortController} : att))
    )

    try {
      const fileId = await uploadFile(
        {uri: file.uri, name: file.name, type: file.type, size: file.size},
        progress => {
          setAttachments(prev => prev.map(att => (att.id === file.id ? {...att, progress} : att)))
        },
        abortController.signal
      )

      if (fileId) {
        setAttachments(prev =>
          prev.map(att =>
            att.id === file.id ? {...att, progress: 100, uploadedFileId: fileId} : att
          )
        )
      } else {
        setAttachments(prev =>
          prev.map(att => (att.id === file.id ? {...att, error: 'Upload failed'} : att))
        )
      }
    } catch (error) {
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        // Remove the attachment if it was cancelled
        setAttachments(prev => prev.filter(att => att.id !== file.id))
      } else {
        setAttachments(prev =>
          prev.map(att => (att.id === file.id ? {...att, error: 'Upload failed'} : att))
        )
      }
    }
  }

  const onSubmitClick = async () => {
    const uploadedAttachments = attachments.filter(att => att.uploadedFileId && !att.error)
    if (inputValue.trim() || uploadedAttachments.length > 0) {
      if (await onMessage(inputValue, uploadedAttachments, thinkModel)) {
        setInputValue('')
        setAttachments([])
      } else {
        // TODO error?
      }
    }
  }

  function alertFileCount() {
    Alert.alert(
      'Maximum files exceeded',
      `The maximum number of files allowed is ${MAX_FILES_COUNT_PER_MESSAGE}, remove some to proceed.`
    )
  }

  const onPlusClick = () => {
    if (attachments.length < MAX_FILES_COUNT_PER_MESSAGE) {
      setShowAttachmentMenu(true)
    } else {
      alertFileCount()
    }
  }

  const onThinkClick = () => {
    setThinkModel(!thinkModel)
  }

  const onSelectFiles = async () => {
    if (attachments.length >= MAX_FILES_COUNT_PER_MESSAGE) {
      alertFileCount()
      return
    }
    const files = await pickFiles()
    if (files.length > 0) {
      if (attachments.length + files.length > MAX_FILES_COUNT_PER_MESSAGE) {
        alertFileCount()
        return
      }
      setAttachments(prev => [...prev, ...files])
      // Start uploading immediately
      files.forEach(startUpload)
    }
  }

  const onSelectCamera = async () => {
    if (attachments.length >= MAX_FILES_COUNT_PER_MESSAGE) {
      alertFileCount()
      return
    }
    const photo = await takePhoto()
    if (photo) {
      setAttachments(prev => [...prev, photo])
      // Start uploading immediately
      startUpload(photo)
    }
  }

  const onSelectPhotos = async () => {
    if (attachments.length >= MAX_FILES_COUNT_PER_MESSAGE) {
      alertFileCount()
      return
    }
    const photos = await pickPhotos()
    if (photos.length > 0) {
      if (attachments.length + photos.length > MAX_FILES_COUNT_PER_MESSAGE) {
        alertFileCount()
        return
      }

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
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment}/>

        <ThemedView
          className="flex flex-col gap-2 rounded-2xl px-2 py-2"
          style={[{backgroundColor, borderColor, borderWidth: 1}]}
        >
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            className={combinedClassName}
            style={[{color}, style]}
            placeholderTextColor={placeholderColor}
            {...otherProps}
          />
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <View className="rounded-full border p-1" style={{borderColor, borderWidth: 1}}>
                <PlusIcon onClick={onPlusClick}/>
              </View>
              <ThinkButton isActive={thinkModel} onClick={onThinkClick}/>
            </View>
            <UpArrowIcon onClick={onSubmitClick}/>
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
