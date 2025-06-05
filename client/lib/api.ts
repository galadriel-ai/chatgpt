import {API_BASE_URL} from '@env'
import {Chat, ChatDetails, Message} from "@/types/chat";


async function getChats(): Promise<Chat[]> {
  interface ApiResponse {
    chats: Chat[]
  }

  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      // TODO: how does user auth work?
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return []
    const responseJson: ApiResponse = await response.json()
    return responseJson.chats
  } catch {
    return []
  }
}

async function getChatDetails(chatId: string): Promise<ChatDetails | null> {
  interface ApiResponse {
    id: string,
    title: string,
    // Works as long as we dont need some special mapping here
    messages: {
      id: string,
      role: "system" | "user" | "assistant",
      content: string,
    }[]
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'GET',
      // TODO: how does user auth work?
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) return null
    const responseJson: ApiResponse = await response.json()
    return {
      id: responseJson.id,
      title: responseJson.title,
      messages: responseJson.messages.map(m => {
        return {
          id: m.id,
          role: m.role,
          content: m.content,
        }
      }),
    }
  } catch {
    return null
  }
}

const api = {
  getChats,
  getChatDetails,
}

export {api}
