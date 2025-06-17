import { API_BASE_URL as ENV_API_BASE_URL } from '@env'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { Chat, ChatConfiguration, ChatDetails, JobStatus, UserInfo } from '@/types/chat'

// Constants for secure storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Modified API functions to use fetchWithAuth
const API_BASE_URL = ENV_API_BASE_URL || 'https://chatgpt.galadriel.com'

interface ApiChatConfiguration {
  id: string
  user_name: string
  ai_name: string
  description: string
  role: string
}

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
    const accessToken = await getAccessToken()
    if (!accessToken) return emptyResponse

    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
  } catch (e) {
    console.error('Error fetching current user:', e)
    return null
  }
}

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
    created_at: number
    // Works as long as we dont need some special mapping here
    messages: {
      id: string
      role: 'system' | 'user' | 'assistant'
      content: string
      attachment_ids: string[]
      image_url: string | null
    }[]
    configuration: ApiChatConfiguration | null
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
      createdAt: responseJson.created_at,
      messages: responseJson.messages.map(m => {
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          attachmentIds: m.attachment_ids,
          imageUrl: m.image_url,
        }
      }),
      configuration: responseJson.configuration
        ? {
            id: responseJson.configuration.id,
            userName: responseJson.configuration.user_name,
            aiName: responseJson.configuration.ai_name,
            description: responseJson.configuration.description,
            role: responseJson.configuration.role,
          }
        : null,
    }
  } catch (error) {
    console.error('Error fetching chat details:', error)
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
  generation_id?: string
  generation_message?: string
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

const getJobStatus = async (jobId: string): Promise<JobStatus | null> => {
  try {
    const { accessToken, refreshToken } = await getTokens()
    if (!accessToken) {
      return null
    }
    const response = await fetch(`${API_BASE_URL}/job/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!response.ok) return null
    const responseJson: JobStatus = await response.json()
    return responseJson
  } catch (e) {
    console.error('Error fetching job status:', e)
    return null
  }
}

const createChatConfiguration = async (
  configuration: ChatConfiguration
): Promise<ChatConfiguration | null> => {
  type ApiResponse = ApiChatConfiguration

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) return null

    const response = await fetch(`${API_BASE_URL}/configure/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
  // Authentication
  authenticateWithGoogle,
  authenticateWithApple,
  refreshToken,
  logout,
  getCurrentUser,
  getJobStatus,
  // Chat
  getChats,
  getUserInfo,
  getChatDetails,
  streamChatResponse,
  uploadFile,
  createChatConfiguration,
}

export { api }
