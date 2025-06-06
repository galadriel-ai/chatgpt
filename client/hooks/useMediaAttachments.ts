import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import { useFileUpload, UploadingFile } from './useFileUpload'

export interface AttachmentFile {
  id: string
  name: string
  type: string
  uri: string
  size?: number
  progress: number
  uploadedFileId?: string
  error?: string
  abortController?: AbortController
}

export function useMediaAttachments() {
  const [isLoading, setIsLoading] = useState(false)
  const { uploadFile } = useFileUpload()

  const pickFiles = async (): Promise<AttachmentFile[]> => {
    try {
      setIsLoading(true)
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (!result.canceled) {
        return result.assets.map(asset => ({
          id: `temp_${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
          progress: 0,
        }))
      }
      return []
    } catch (error) {
      console.error('Error picking files:', error)
      Alert.alert('Error', 'Failed to pick files')
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const takePhoto = async (): Promise<AttachmentFile | null> => {
    try {
      setIsLoading(true)
      
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos')
        return null
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        return {
          id: `temp_${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
          progress: 0,
        }
      }
      return null
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const pickPhotos = async (): Promise<AttachmentFile[]> => {
    try {
      setIsLoading(true)
      
      // Request media library permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!mediaPermission.granted) {
        Alert.alert('Permission needed', 'Media library permission is required to select photos')
        return []
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      })

      if (!result.canceled) {
        return result.assets.map((asset, index) => ({
          id: `temp_${Date.now()}_${index}`,
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
          progress: 0,
        }))
      }
      return []
    } catch (error) {
      console.error('Error picking photos:', error)
      Alert.alert('Error', 'Failed to pick photos')
      return []
    } finally {
      setIsLoading(false)
    }
  }

  return {
    pickFiles,
    takePhoto,
    pickPhotos,
    isLoading,
  }
} 