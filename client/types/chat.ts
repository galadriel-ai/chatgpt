// TODO:
export type Message = {
  id: string
  chatId: string
  senderId: string
  text: string
  timestamp: number
}

export type Chat = {
  id: string
  title: string
  messages: Message[] // or messageIds if normalized
  lastUpdated: number
}
