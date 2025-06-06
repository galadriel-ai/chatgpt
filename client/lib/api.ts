import { API_BASE_URL } from '@env'
import { Chat, ChatDetails, Message } from '@/types/chat'

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
  } catch {
    return []
  }
}

async function getChatDetails(chatId: string): Promise<ChatDetails | null> {
  interface ApiResponse {
    id: string
    title: string
    // Works as long as we dont need some special mapping here
    messages: {
      id: string
      role: 'system' | 'user' | 'assistant'
      content: string
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
      messages: responseJson.messages.map(m => {
        return {
          id: m.id,
          role: m.role,
          content: m.content,
        }
      }),
    }
  } catch {
    return null
  }
}

async function uploadFile(
  file: { uri: string; name: string; type: string; size?: number },
  onProgress: (progress: number) => void
): Promise<string | null> {
  try {
    console.log('Uploading file:', file)

    const formData = new FormData()
    
    // For React Native, we can directly append the file object with uri
    // FormData in RN handles file URIs properly without needing to fetch/blob
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any)

    console.log('FormData with file URI created')

    const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - let browser/RN set it with boundary
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
    return null
  }
}

const api = {
  getChats,
  getChatDetails,
  uploadFile,
}

export { api }
