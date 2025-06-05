import {createContext, ReactNode, useContext, useEffect, useState} from 'react'
import {Chat, ChatDetails} from '@/types/chat'
import {useAuth} from '@/context/AuthContext'
import {api} from "@/lib/api";

type ChatProviderProps = {
  children: ReactNode
}

type ChatContextType = {
  chats: Chat[]
  selectedChat: Chat | null
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>
  activeChat: ChatDetails | null
  setActiveChat: React.Dispatch<React.SetStateAction<ChatDetails | null>>
  sendMessage: (chatId: string, text: string) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({children}: ChatProviderProps) => {
  const {user} = useAuth()

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeChat, setActiveChat] = useState<ChatDetails | null>(null)

  useEffect(() => {
    if (!user) return

    getChats()
  }, [user])

  const getChats = async (): Promise<void> => {
    const newChats = await api.getChats()
    setChats(newChats)
  }

  const sendMessage = (chatId: string, text: string) => {
    // update in-memory
    // persist to storage/API
  }

  return (
    <ChatContext.Provider value={{
      chats,
      selectedChat,
      setSelectedChat,
      activeChat,
      setActiveChat,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}
