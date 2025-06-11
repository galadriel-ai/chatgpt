import { api } from '@/lib/api'

export interface UploadingFile {
  id: string // temporary local ID
  name: string
  type: string
  uri: string
  size?: number
  progress: number // 0-100
  uploadedFileId?: string // server file ID after upload
  error?: string
  abortController?: AbortController
}

export function useFileUpload() {
  const uploadFile = async (
    file: { uri: string; name: string; type: string; size?: number },
    onProgress: (progress: number) => void,
    abortSignal?: AbortSignal
  ): Promise<string | null> => {
    return api.uploadFile(file, onProgress, abortSignal)
  }

  return { uploadFile }
}
