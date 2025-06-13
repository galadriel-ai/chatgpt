import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Chat, ChatConfiguration, ChatDetails } from '@/types/chat'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Storage } from 'expo-storage'

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
  isChatConfigurationEnabled: boolean
  setIsChatConfigurationEnabled: (value: boolean) => Promise<void>
}

const CONFIGURATION_TOGGLE_KEY = 'is_chat_configuration_enabled'

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth()

  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeChat, setActiveChat] = useState<ChatDetails | null>(null)
  const [isChatConfigurationEnabled, _setIsChatConfigurationEnabled] = useState<boolean>(false)
  const [chatConfiguration, setChatConfiguration] = useState<ChatConfiguration | null>(null)

  useEffect(() => {
    if (!user) return
    getChats()
    getIsChatConfigurationEnabled()
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

  const getIsChatConfigurationEnabled = async () => {
    const stored = await Storage.getItem({ key: CONFIGURATION_TOGGLE_KEY })
    if (stored !== null) {
      _setIsChatConfigurationEnabled(stored === 'true')
    }
  }

  const setIsChatConfigurationEnabled = async (value: boolean) => {
    _setIsChatConfigurationEnabled(value)
    await Storage.setItem({
      key: CONFIGURATION_TOGGLE_KEY,
      value: value.toString(),
    })
  }

  const addChat = (chat: Chat) => {
    setChats(prev => [chat, ...prev])
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
        isChatConfigurationEnabled,
        setIsChatConfigurationEnabled,
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
