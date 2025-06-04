// TODO:
export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type Chat = {
  id: string
  title: string
  messages: Message[] // or messageIds if normalized
  lastUpdated: number
}
