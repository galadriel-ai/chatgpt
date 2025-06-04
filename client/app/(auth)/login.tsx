import { Button, StyleSheet, View } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = () => {
    login({ name: 'User' })
    router.replace('/(main)')
  }

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      // Use the Apple credential to login
      login({
        name: credential.fullName?.givenName || 'Apple User',
        email: credential.email,
        appleId: credential.user,
      })
      router.replace('/(main)')
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        console.log('User canceled Apple Sign In')
      } else {
        // Handle other errors
        console.error('Apple Sign In Error:', e)
      }
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Login</ThemedText>

      <View style={styles.buttonContainer}>
        <Button title="Guest Login" onPress={handleLogin} />

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={styles.appleButton}
          onPress={handleAppleLogin}
        />
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 20,
  },
  appleButton: {
    width: '100%',
    height: 44,
  },
})
