import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedChatInput } from '@/components/theme/ThemedChatInput'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { SideBarIcon } from '@/components/icons/Icons'

export function ChatWrapper() {
  const navigation = useNavigation()

  const onMessage = (message: string): boolean => {
    console.log(message)
    return true
  }

  return (
    <ThemedView className="flex-1 px-2">
      <ThemedView className="flex flex-row pt-8">
        <SideBarIcon onClick={() => navigation.dispatch(DrawerActions.openDrawer())} />
      </ThemedView>
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
            {/* Render message bubbles here */}
          </ScrollView>

          <ThemedChatInput
            onMessage={onMessage}
            placeholder="Message"
            className="px-4 py-2"
            style={{ fontSize: 16 }}
          />
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}
