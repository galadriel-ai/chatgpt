import { ThemedView } from '@/components/theme/ThemedView'
import { AuthProvider } from '@/context/AuthContext'
import { ChatProvider } from '@/context/ChatContext'
import { useColorScheme } from '@/hooks/useColorScheme'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { Platform, View } from 'react-native'
import 'react-native-reanimated'
import '../global.css'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

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
