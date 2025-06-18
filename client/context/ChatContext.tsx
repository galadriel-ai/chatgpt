import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Chat, ChatConfiguration, ChatDetails } from '@/types/chat'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

type ChatProviderProps = {
  children: ReactNode
}

type ChatContextType = {
  chats: Chat[]
  selectedChat: Chat | null
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>
  activeChat: ChatDetails | null
  setActiveChat: React.Dispatch<React.SetStateAction<ChatDetails | null>>
  addChat: (chat: Chat) => void
  chatConfiguration: ChatConfiguration | null
  setChatConfiguration: React.Dispatch<React.SetStateAction<ChatConfiguration | null>>
  selectedChatConfiguration: ChatConfiguration | null | undefined
  setSelectedChatConfiguration: (configuration: ChatConfiguration | null) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth()

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeChat, setActiveChat] = useState<ChatDetails | null>(null)
  const [chatConfiguration, setChatConfiguration] = useState<ChatConfiguration | null>(null)
  const [selectedChatConfiguration, _setSelectedChatConfiguration] = useState<
    ChatConfiguration | null | undefined
  >(undefined)

  useEffect(() => {
    if (!user) return
    getChats()
  }, [user])

  const getChats = async (): Promise<void> => {
    const userInfo = await api.getUserInfo()
    setChats(userInfo.chats)
    if (userInfo.chatConfiguration) setChatConfiguration(userInfo.chatConfiguration)
    else {
      setChatConfiguration({
        id: '',
        userName: '',
        aiName: '',
        description: '',
        role: '',
      })
    }
  }

  const addChat = (chat: Chat) => {
    setChats(prev => [chat, ...prev])
  }

  const setSelectedChatConfiguration = (configuration: ChatConfiguration | null) => {
    _setSelectedChatConfiguration(configuration)
  }

  return (
    <ChatContext.Provider
      value={{
        chats,
        selectedChat,
        setSelectedChat,
        activeChat,
        setActiveChat,
        addChat,
        chatConfiguration,
        setChatConfiguration,
        selectedChatConfiguration,
        setSelectedChatConfiguration,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
