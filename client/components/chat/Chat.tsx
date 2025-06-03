import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { ThemedTextInput } from '@/components/ThemedTextInput'

export function Chat() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={10}
    >
      <ThemedView className="flex-1">
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText variant="heading">Chat stuff</ThemedText>
          {/* Render message bubbles here */}
        </ScrollView>

        <ThemedView className="border-t border-gray-200 bg-white p-4 pb-8">
          <ThemedTextInput
            placeholder="Type a message"
            className="rounded-full bg-gray-100 px-4 py-2"
            style={{ fontSize: 16 }}
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  )
}
