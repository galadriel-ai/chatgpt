import { ThemedView } from '@/components/theme/ThemedView'
import { AuthProvider } from '@/context/AuthContext'
import { ChatProvider } from '@/context/ChatContext'
import { useColorScheme } from '@/hooks/useColorScheme'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { Platform, View } from 'react-native'
import 'react-native-reanimated'
import '../global.css'
import { PostHogProvider, usePostHog } from 'posthog-react-native'
import { POSTHOG_API_KEY, POSTHOG_HOST } from '@env'
import { useEffect } from 'react'
import { EVENTS } from '@/lib/analytics/posthog'

function AppContent() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture(EVENTS.APP_START)
  }, [posthog])

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ThemedView className="flex-1">
        <AuthProvider>
          <ChatProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                },
                headerTintColor: isDark ? '#ffffff' : '#000000',
                headerBackground: () =>
                  Platform.OS === 'ios' ? (
                    <View
                      className={`absolute inset-0 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}
                    />
                  ) : (
                    <View
                      className={`absolute inset-0 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}
                    />
                  ),
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: 'transparent',
                },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
              <Stack.Screen
                name="(main)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  title: 'Not Found',
                  presentation: 'modal',
                }}
              />
            </Stack>
          </ChatProvider>
        </AuthProvider>
      </ThemedView>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
      }}
    >
      <AppContent />
    </PostHogProvider>
  )
}
