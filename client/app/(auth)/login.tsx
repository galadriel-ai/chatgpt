import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedView } from '@/components/theme/ThemedView'
import { useAuth } from '@/context/AuthContext'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Button, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Configure Google Sign In when the component mounts
    GoogleSignin.configure({
      // Add your web client ID here
      webClientId: '251250634163-np6qc6c39rr2v9cvfltu409hg63bf28k.apps.googleusercontent.com',
      iosClientId: '251250634163-np6qc6c39rr2v9cvfltu409hg63bf28k.apps.googleusercontent.com',
    })
  }, [])

  const handleLogin = () => {
    login({ name: 'User' })
    router.replace('/(main)')
  }

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()

      if (userInfo) {
        login({
          name: userInfo.user.name || 'Google User',
          email: userInfo.user.email,
          googleId: userInfo.user.id,
        })
        router.replace('/(main)')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign in flow')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available')
      } else {
        console.error('Google Sign In Error:', error)
      }
    }
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

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <ThemedText style={styles.googleButtonText}>Sign in with Google</ThemedText>
        </TouchableOpacity>

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
  googleButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#4285F4',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
