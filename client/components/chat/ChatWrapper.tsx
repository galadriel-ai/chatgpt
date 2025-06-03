import {Button, KeyboardAvoidingView, Platform, ScrollView} from 'react-native'
import {ThemedView} from '@/components/theme/ThemedView'
import {ThemedTextInput} from '@/components/theme/ThemedTextInput'
import {DrawerActions, useNavigation} from '@react-navigation/native'

export function ChatWrapper() {
  const navigation = useNavigation()

  return (
    <ThemedView className="flex-1 px-2">
      <ThemedView className="flex flex-row pt-4">
        <Button
          title="Open Sidebar"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
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

          <ThemedTextInput placeholder="Message" className="px-4 py-2" style={{ fontSize: 16 }} />
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}
