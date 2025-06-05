// TODO:
export type Message = {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface Chat {
  id: string
  title: string
}

export interface ChatDetails extends Chat {
  messages: Message[]
}
