// TODO:
export type Message = {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  attachmentIds?: string[] // Only store file IDs
  imageUrl?: string | null
}

export interface Chat {
  id: string
  title: string
  createdAt: number
}

export interface ChatConfiguration {
  id: string
  userName: string
  aiName: string
  description: string
  role: string
}

export interface ChatDetails extends Chat {
  messages: Message[]
  configuration: ChatConfiguration | null
}

export interface UserInfo {
  chats: Chat[]
  chatConfiguration: ChatConfiguration | null
}

export interface JobStatus {
  id: string
  status: string
  url: string | null
}
