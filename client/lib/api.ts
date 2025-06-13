import { Chat, ChatDetails } from '@/types/chat'
import { API_BASE_URL } from '@env'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'

// Constants for secure storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

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

// Helper function to get stored tokens
async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ])
    return { accessToken, refreshToken }
  } catch (error) {
    console.error('Error getting tokens:', error)
    return { accessToken: null, refreshToken: null }
  }
}

// Helper function to store tokens securely
async function storeTokens(accessToken: string, refreshToken?: string) {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
    }
  } catch (error) {
    console.error('Error storing tokens:', error)
    throw new Error('Failed to store authentication tokens')
  }
}

// Helper function to clear tokens
async function clearTokens() {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ])
  } catch (error) {
    console.error('Error clearing tokens:', error)
  }
}

// Helper function to refresh token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await api.refreshToken(refreshToken)
    if (response?.access_token) {
      await storeTokens(response.access_token)
      return response.access_token
    }
    return null
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

// Wrapper for fetch that handles token refresh
async function fetchWithAuth(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options
  const { accessToken, refreshToken } = await getTokens()

  // Add auth header if we have a token and auth is not skipped
  if (!skipAuth && accessToken) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }

  let response = await fetch(url, fetchOptions)

  // If we get a 401 and have a refresh token, try to refresh
  if (response.status === 401 && refreshToken && !skipAuth) {
    const newAccessToken = await refreshAccessToken(refreshToken)
    if (newAccessToken) {
      // Retry the original request with the new token
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${newAccessToken}`,
      }
      response = await fetch(url, fetchOptions)
    } else {
      // If refresh failed, clear tokens and redirect to login
      await clearTokens()
      router.replace('/(auth)/login')
      throw new Error('Session expired. Please log in again.')
    }
  }

  return response
}

// Helper function to get stored access token
async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

async function authenticateWithGoogle(authData: GoogleAuthData): Promise<AuthResponse | null> {
  try {
    console.log('Google auth request started')
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    })
    console.log('Google auth request completed')
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
        Authorization: `Bearer ${accessToken}`,
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
        Authorization: `Bearer ${accessToken}`,
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

// Modified API functions to use fetchWithAuth
async function getChats(): Promise<Chat[]> {
  interface ApiResponse {
    chats: Chat[]
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) return []
    const responseJson: ApiResponse = await response.json()
    return responseJson.chats
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

async function getChatDetails(chatId: string): Promise<ChatDetails | null> {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) return null
    const responseJson: ApiResponse = await response.json()
    return {
      id: responseJson.id,
      title: responseJson.title,
      messages: responseJson.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    }
  } catch (error) {
    console.error('Error fetching chat details:', error)
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

const streamChatResponse = async (
  chatInput: ChatInput,
  onChunk: (chunk: ChatChunk) => void,
  onDone?: () => void,
  onError?: (err: any) => void
) => {
  const { accessToken, refreshToken } = await getTokens()
  if (!accessToken) {
    onError?.(new Error('No access token available'))
    return
  }

  const xhr = new XMLHttpRequest()
  let lastLength = 0
  let isRefreshing = false

  xhr.open('POST', `${API_BASE_URL}/chat`, true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)

  xhr.onreadystatechange = async () => {
    if (xhr.readyState === xhr.LOADING || xhr.readyState === xhr.DONE) {
      // Handle 401 Unauthorized
      if (xhr.status === 401 && refreshToken && !isRefreshing) {
        isRefreshing = true
        try {
          const newAccessToken = await refreshAccessToken(refreshToken)
          if (newAccessToken) {
            // Retry the request with new token
            xhr.abort()
            streamChatResponse(chatInput, onChunk, onDone, onError)
            return
          } else {
            // If refresh failed, clear tokens and redirect to login
            await clearTokens()
            router.replace('/(auth)/login')
            onError?.(new Error('Session expired. Please log in again.'))
            return
          }
        } catch (error) {
          console.error('Error refreshing token:', error)
          onError?.(error)
          return
        } finally {
          isRefreshing = false
        }
      }

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
          console.warn('Failed to parse chunk:', trimmed, 'Error:', err)
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
