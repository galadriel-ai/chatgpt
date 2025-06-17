import { createContext, ReactNode, useContext, useState, useEffect } from 'react'
import { usePostHog } from 'posthog-react-native'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { api } from '@/lib/api'

const AuthContext = createContext<any>(null)

type AuthProviderProps = {
  children: ReactNode
}

// Constants for secure storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const posthog = usePostHog()
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)

      if (accessToken) {
        // Try to get user info with the stored token
        const userInfo = await api.getCurrentUser(accessToken)
        if (userInfo) {
          // Token is valid, set user in context
          login({
            ...userInfo,
            accessToken,
            refreshToken,
          })
        } else {
          // Token is invalid, clear stored tokens
          await clearTokens()
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      await clearTokens()
    } finally {
      setIsLoading(false)
    }
  }

  const clearTokens = async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
      setUser(null)
      posthog.reset()
    } catch (error) {
      console.error('Error clearing tokens:', error)
    }
  }

  const login = (userInfo: any) => {
    setUser(userInfo)
    posthog.identify(userInfo.email || 'unknown', {
      name: userInfo.name,
      email: userInfo.email,
    })
  }

  const logout = async () => {
    await clearTokens()
    router.replace('/(auth)/login')
  }

  if (isLoading) {
    // You might want to show a loading screen here
    return null
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
