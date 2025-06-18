import { ThemedView } from '@/components/theme/ThemedView'
import { RoleAssistantIcon } from '@/components/icons/Icons'
import { ThemedText } from '@/components/theme/ThemedText'
import React from 'react'

export function ErrorMessage({ error }: { error: string }) {
  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        <RoleAssistantIcon />
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">Your Sidekik</ThemedText>
        <ThemedText lightColor={'#fc161a'} darkColor={'#fc161a'}>
          Error: {error}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  )
}
