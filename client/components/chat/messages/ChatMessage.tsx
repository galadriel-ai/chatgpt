import {ChatConfiguration, Message} from "@/types/chat";
import {ThemedView} from "@/components/theme/ThemedView";
import {RoleAssistantIcon, RoleUserIcon} from "@/components/icons/Icons";
import {ThemedText} from "@/components/theme/ThemedText";
import {ThemedMarkdownText} from "@/components/theme/ThemedMarkdownText";
import {Image, TouchableOpacity} from "react-native";
import React from "react";

export function ChatMessage(
  {
    message,
    configuration,
    setFullscreenImage,
  }: {
    message: Message
    configuration: ChatConfiguration | null
    setFullscreenImage: (url: string) => void
  }) {
  if (message.role === 'system') return null

  if (message.role === 'assistant' && !message.content.trim() && !message.imageUrl) {
    return null
  }

  const role =
    message.role === 'user'
      ? configuration
        ? configuration.userName
        : 'You'
      : configuration
        ? configuration.aiName
        : 'Your Sidekik'

  return (
    <ThemedView className="flex flex-row gap-4 py-3">
      <ThemedView className="flex w-8 flex-col items-center">
        {message.role === 'user' ? <RoleUserIcon/> : <RoleAssistantIcon/>}
      </ThemedView>
      <ThemedView className="flex flex-1 flex-col gap-1">
        <ThemedText className="font-bold">{role}</ThemedText>
        {message.content && <ThemedMarkdownText content={message.content}/>}
        {message.imageUrl && (
          <TouchableOpacity onPress={() => setFullscreenImage(message.imageUrl!)}>
            <Image
              source={{uri: message.imageUrl}}
              style={{
                width: '100%',
                aspectRatio: 1,
                maxHeight: 300,
                borderRadius: 8,
                marginTop: 8,
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
        )}
        {message.attachmentIds?.length ? (
          <ThemedView className="mt-2">
            <ThemedText className="text-sm opacity-70">
              📎 {message.attachmentIds.length} attachment
              {message.attachmentIds.length > 1 ? 's' : ''}
            </ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </ThemedView>
  )
}