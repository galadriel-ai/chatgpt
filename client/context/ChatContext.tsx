import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Chat } from '@/types/chat'
import { useAuth } from '@/context/AuthContext'

type ChatProviderProps = {
  children: ReactNode
}

type ChatContextType = {
  chats: Chat[]
  activeChat: Chat | null
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | null>>
  sendMessage: (chatId: string, text: string) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth()

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)

  useEffect(() => {
    if (!user) return

    getChats()
  }, [user])

  const getChats = async (): Promise<void> => {
    // TODO: call API, or localStorage
    const newChats = [
      {
        id: '1',
        title: 'title',
        messages: [],
        lastUpdated: 1,
      },
    ]
    setChats(newChats)
  }

  const sendMessage = (chatId: string, text: string) => {
    // update in-memory
    // persist to storage/API
  }

  return (
    <ChatContext.Provider value={{ chats, activeChat, setActiveChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}
