// TODO:
export type Message = {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  attachmentIds?: string[] // Only store file IDs
}

export interface Chat {
  id: string
  title: string
  createdAt: number
}

export interface ChatDetails extends Chat {
  messages: Message[]
}
