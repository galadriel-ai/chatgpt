import { ChatConfiguration } from '@/types/chat'
import { RoleAssistantIcon } from '@/components/icons/Icons'
import React from 'react'
import Osho from '@/assets/characters/osho.svg'
import Dalai from '@/assets/characters/dalai.svg'
import Tony from '@/assets/characters/tony.svg'

export const CONFIGURATION_OSHO: ChatConfiguration = {
  id: '0685158b-43ce-7ca6-8000-18854415bed5',
  userName: 'You',
  aiName: 'Osho',
  description: '',
  role: '',
}
export const CONFIGURATION_DALAI: ChatConfiguration = {
  id: '06851576-6578-7a4c-8000-60118b690397',
  userName: 'You',
  aiName: 'Dalai Lama',
  description: '',
  role: '',
}
export const CONFIGURATION_TONY: ChatConfiguration = {
  id: '0685158b-49ba-74a4-8000-ce384f83496c',
  userName: 'You',
  aiName: 'Tony Robbins',
  description: '',
  role: '',
}

export function getAssistantProfilePicture(configuration: ChatConfiguration | null) {
  if (!configuration) {
    return <RoleAssistantIcon />
  }
  if (configuration.id === CONFIGURATION_OSHO.id) {
    return <Osho width={32} height={32} />
  } else if (configuration.id === CONFIGURATION_DALAI.id) {
    return <Dalai width={32} height={32} />
  } else if (configuration.id === CONFIGURATION_TONY.id) {
    return <Tony width={32} height={32} />
  } else {
    return <RoleAssistantIcon />
  }
}
