import { createContext, ReactNode, useContext, useState } from 'react'
import { usePostHog } from 'posthog-react-native'

const AuthContext = createContext<any>(null)

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState(null)
  const posthog = usePostHog()

  const login = (userInfo: any) => {
    setUser(userInfo)
    posthog.identify(userInfo.email || 'unknown', {
      name: userInfo.name,
      email: userInfo.email,
    })
  }

  const logout = () => {
    setUser(null)
    posthog.reset()
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
