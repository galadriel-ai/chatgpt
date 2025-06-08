import { Chat, ChatDetails } from '@/types/chat'
import { API_BASE_URL } from '@env'

// Authentication API functions
export interface AuthResponse {
  message: string
  user: {
    uid: string
    name?: string
    email?: string
    profile_picture?: string
    auth_provider: 'google' | 'apple' | 'local'
    is_email_verified: boolean
    created_at?: string
    last_login_at?: string
  }
  access_token: string
  refresh_token: string
}

export interface GoogleAuthData {
  id_token: string
  name: string
  email: string
  google_id: string
  profile_picture?: string
}

export interface AppleAuthData {
  identity_token: string
  authorization_code: string
  name?: string
  email?: string
  apple_id: string
}

async function authenticateWithGoogle(authData: GoogleAuthData): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Google auth error:', errorData)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Google auth request failed:', error)
    return null
  }
}

async function authenticateWithApple(authData: AppleAuthData): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/apple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Apple auth error:', errorData)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Apple auth request failed:', error)
    return null
  }
}

async function refreshToken(refreshToken: string): Promise<{ access_token: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

async function logout(accessToken: string, refreshToken?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    return response.ok
  } catch (error) {
    console.error('Logout failed:', error)
    return false
  }
}

async function getCurrentUser(accessToken: string): Promise<AuthResponse['user'] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Get current user failed:', error)
    return null
  }
}

// Existing chat functions with authentication
async function getChats(accessToken?: string): Promise<Chat[]> {
  interface ApiResponse {
    chats: Chat[]
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers,
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

async function getChatDetails(chatId: string, accessToken?: string): Promise<ChatDetails | null> {
  interface ApiResponse {
    id: string
    title: string
    messages: {
      id: string
      role: 'system' | 'user' | 'assistant'
      content: string
    }[]
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'GET',
      headers,
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
  // Authentication
  authenticateWithGoogle,
  authenticateWithApple,
  refreshToken,
  logout,
  getCurrentUser,
  // Chat
  getChats,
  getChatDetails,
  streamChatResponse,
}

export { api }
