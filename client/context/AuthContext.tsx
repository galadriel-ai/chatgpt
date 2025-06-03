import { createContext, ReactNode, useContext, useState } from 'react'

const AuthContext = createContext<any>(null)

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState(null)

  const login = (userInfo: any) => setUser(userInfo)
  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
