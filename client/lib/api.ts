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

interface ChatInput {
  chatId: string | null
  message: string
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
    })
  )
}

const api = {
  getChats,
  getChatDetails,
  streamChatResponse,
}

export { api }
