import { API_BASE_URL } from '@env'
import { Chat, ChatDetails } from '@/types/chat'

async function getChats(): Promise<Chat[]> {
  interface ApiResponse {
    chats: Chat[]
  }

  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      // TODO: how does user auth work?
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return []
    const responseJson: ApiResponse = await response.json()
    return responseJson.chats
  } catch (e) {
    console.log('e')
    console.log(e)
    return []
  }
}

async function getChatDetails(chatId: string): Promise<ChatDetails | null> {
  interface ApiResponse {
    id: string
    title: string
    created_at: number
    // Works as long as we dont need some special mapping here
    messages: {
      id: string
      role: 'system' | 'user' | 'assistant'
      content: string
      attachment_ids: string[]
    }[]
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'GET',
      // TODO: how does user auth work?
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return null
    const responseJson: ApiResponse = await response.json()
    return {
      id: responseJson.id,
      title: responseJson.title,
      createdAt: responseJson.created_at,
      messages: responseJson.messages.map(m => {
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          attachmentIds: m.attachment_ids,
        }
      }),
    }
  } catch {
    return null
  }
}

interface ChatInput {
  chatId: string | null
  message: string
  attachmentIds?: string[]
  thinkModel?: boolean
}

export interface ChatChunk {
  chat_id?: string
  content?: string
  error?: string
}

const streamChatResponse = (
  chatInput: ChatInput,
  onChunk: (chunk: ChatChunk) => void,
  onDone?: () => void,
  onError?: (err: any) => void
) => {
  const xhr = new XMLHttpRequest()
  let lastLength = 0

  xhr.open('POST', `${API_BASE_URL}/chat`, true)
  xhr.setRequestHeader('Content-Type', 'application/json')

  xhr.onreadystatechange = () => {
    if (xhr.readyState === xhr.LOADING || xhr.readyState === xhr.DONE) {
      const newText = xhr.responseText.substring(lastLength)
      lastLength = xhr.responseText.length

      // Handle newline-delimited JSON chunks
      newText.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) return

        try {
          const parsed: ChatChunk = JSON.parse(trimmed)
          onChunk(parsed)
        } catch (err) {
          console.warn('Failed to parse chunk:', trimmed)
        }
      })
    }

    if (xhr.readyState === xhr.DONE) {
      onDone?.()
    }
  }

  xhr.onerror = () => {
    onError?.(new Error('Stream error'))
  }

  xhr.send(
    JSON.stringify({
      chat_id: chatInput.chatId,
      content: chatInput.message,
      attachment_ids: chatInput.attachmentIds,
      think_model: chatInput.thinkModel,
    })
  )
}

async function uploadFile(
  file: { uri: string; name: string; type: string; size?: number },
  onProgress: (progress: number) => void,
  abortSignal?: AbortSignal
): Promise<string | null> {
  try {
    console.log('Uploading file:', file)

    const formData = new FormData()
    
    // Check if we're in web environment or React Native
    // @ts-ignore - Platform is available in React Native
    const isWeb = typeof window !== 'undefined' && !window.ReactNativeWebView
    
    if (isWeb) {
      // Web environment: need to fetch the file and create a proper blob
      const response = await fetch(file.uri)
      const blob = await response.blob()
      formData.append('file', blob, file.name)
    } else {
      // React Native environment: use the object structure
      const fileToUpload = {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any
      formData.append('file', fileToUpload, file.name)
    }

    console.log('FormData with file URI created')

    const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData,
      signal: abortSignal,
      // Let React Native set Content-Type with proper boundary
    })

    if (uploadResponse.ok) {
      const result = await uploadResponse.json()
      onProgress(100) // Set progress to 100% on completion
      return result.file_id
    } else {
      const errorText = await uploadResponse.text()
      console.log('Upload failed with status:', uploadResponse.status)
      console.log('Response text:', errorText)
      throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`)
    }
  } catch (error) {
    console.error('Upload error:', error)
    // Re-throw AbortError so it can be handled properly upstream
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return null
  }
}

const api = {
  getChats,
  getChatDetails,
  streamChatResponse,
  uploadFile,
}

export { api }
