import { API_BASE_URL as ENV_API_BASE_URL } from '@env'
import { Chat, ChatConfiguration, ChatDetails, UserInfo } from '@/types/chat'

const API_BASE_URL = ENV_API_BASE_URL || 'https://chatgpt.galadriel.com'

async function getUserInfo(): Promise<UserInfo> {
  interface ApiResponse {
    chats: Chat[]
    chat_configuration: {
      id: string
      user_name: string
      ai_name: string
      description: string
      role: string
    } | null
  }

  const emptyResponse: UserInfo = {
    chats: [],
    chatConfiguration: null,
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
    if (!response.ok) return emptyResponse
    const responseJson: ApiResponse = await response.json()
    return {
      chats: responseJson.chats,
      chatConfiguration: responseJson.chat_configuration
        ? {
            id: responseJson.chat_configuration.id,
            userName: responseJson.chat_configuration.user_name,
            aiName: responseJson.chat_configuration.ai_name,
            description: responseJson.chat_configuration.description,
            role: responseJson.chat_configuration.role,
          }
        : null,
    }
  } catch (e) {
    console.log('e')
    console.log(e)
    return emptyResponse
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
  configurationId: string | null
  message: string
  attachmentIds?: string[]
  thinkModel?: boolean
}

export interface ChatChunk {
  chat_id?: string
  content?: string
  error?: string
  background_processing?: string
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
      configuration_id: chatInput.configurationId,
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
    // Validate file before upload
    if (!file.uri) {
      console.error('Upload failed: No file URI provided')
      throw new Error('No file URI provided')
    }

    // Use the official Expo FormData approach
    const formData = new FormData()

    // Create the file object as shown in Expo docs
    const fileObject = {
      uri: file.uri,
      name: file.name,
      type: file.type,
    }

    console.log('File object for FormData:', fileObject)

    // Append to FormData (using 'file' as the field name to match server)
    formData.append('file', fileObject as any)

    console.log('Starting upload with correct headers...')

    const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: abortSignal,
    })

    console.log('Upload response status:', uploadResponse.status)

    if (uploadResponse.ok) {
      const result = await uploadResponse.json()
      console.log('Upload successful, file ID:', result.file_id)
      onProgress(100)
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

const createChatConfiguration = async (
  configuration: ChatConfiguration
): Promise<ChatConfiguration | null> => {
  interface ApiResponse {
    id: string
    user_name: string
    ai_name: string
    description: string
    role: string
  }

  try {
    const response = await fetch(`${API_BASE_URL}/configure/chat`, {
      method: 'POST',
      // TODO: how does user auth work?
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: configuration.userName,
        ai_name: configuration.aiName,
        description: configuration.description,
        role: configuration.role,
      }),
    })
    if (!response.ok) return null
    const responseJson: ApiResponse = await response.json()
    return {
      id: responseJson.id,
      userName: responseJson.user_name,
      aiName: responseJson.ai_name,
      description: responseJson.description,
      role: responseJson.role,
    }
  } catch (e) {
    console.log('Chat configuration API call error', e)
    return null
  }
}

const api = {
  getUserInfo,
  getChatDetails,
  streamChatResponse,
  uploadFile,
  createChatConfiguration,
}

export { api }
