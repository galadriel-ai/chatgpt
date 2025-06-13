import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedView } from '@/components/theme/ThemedView'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { GOOGLE_CLIENT_ID } from '@env'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, StyleSheet, TouchableOpacity, View } from 'react-native'
import { usePostHog } from 'posthog-react-native'
import { EVENTS } from '@/lib/analytics/posthog'

// Constants for secure storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Helper function to store tokens securely
async function storeTokens(accessToken: string, refreshToken?: string) {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
    }
  } catch (error) {
    console.error('Error storing tokens:', error)
    throw new Error('Failed to store authentication tokens')
  }
}

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState({ google: false, apple: false, guest: false })
  const posthog = usePostHog()

  useEffect(() => {
    // Configure Google Sign In when the component mounts
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID,
    })
  }, [])

  const handleLogin = () => {
    posthog.capture(EVENTS.LOGIN_STARTED, { method: 'guest' })
    setLoading(prev => ({ ...prev, guest: true }))
    // For guest login, we'll just use local context for now
    login({ name: 'Guest User' })
    posthog.capture(EVENTS.LOGIN_COMPLETED, { method: 'guest' })
    router.replace('/(main)')
    setLoading(prev => ({ ...prev, guest: false }))
  }

  const handleGoogleLogin = async () => {
    setLoading(prev => ({ ...prev, google: true }))

    try {
      posthog.capture(EVENTS.LOGIN_STARTED, { method: 'google' })
      await GoogleSignin.hasPlayServices()
      console.log('Google Sign In started')
      const userInfo = await GoogleSignin.signIn()
      console.log('Google Sign In completed')
      if (userInfo && userInfo.idToken) {
        console.log('Google Sign In successful')
        // Call backend authentication with correct field names
        const authResponse = await api.authenticateWithGoogle({
          id_token: userInfo.idToken,
          name: userInfo.user.name || 'Google User',
          email: userInfo.user.email,
          google_id: userInfo.user.id,
          profile_picture: userInfo.user.photo || undefined,
        })

        if (authResponse) {
          // Store tokens securely
          await storeTokens(authResponse.access_token, authResponse.refresh_token)

          // Store tokens and user data in context
          login({
            ...authResponse.user,
            accessToken: authResponse.access_token,
            refreshToken: authResponse.refresh_token,
          })
          posthog.capture(EVENTS.LOGIN_COMPLETED, {
          method: 'google',
          email: userInfo.user.email,
        })
        router.replace('/(main)')
        } else {
          Alert.alert(
            'Authentication Failed',
            'Unable to authenticate with Google. Please try again.'
          )
        }
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error)

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign in flow')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available')
      } else {
        Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.')
      }
    } finally {
      setLoading(prev => ({ ...prev, google: false }))
    }
  }

  const handleAppleLogin = async () => {
    setLoading(prev => ({ ...prev, apple: true }))

    try {
      posthog.capture(EVENTS.LOGIN_STARTED, { method: 'apple' })
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken && credential.authorizationCode) {
        // Call backend authentication with correct field names
        const authResponse = await api.authenticateWithApple({
          identity_token: credential.identityToken,
          authorization_code: credential.authorizationCode,
          name: credential.fullName
            ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
            : undefined,
          email: credential.email || undefined,
          apple_id: credential.user,
        })

        if (authResponse) {
          // Store tokens securely
          await storeTokens(authResponse.access_token, authResponse.refresh_token)

          // Store tokens and user data in context
          login({
            ...authResponse.user,
            accessToken: authResponse.access_token,
            refreshToken: authResponse.refresh_token,
          })
          posthog.capture(EVENTS.LOGIN_COMPLETED, {
            method: 'apple',
            email: credential.email,
          })
      router.replace('/(main)')
        } else {
          Alert.alert(
            'Authentication Failed',
            'Unable to authenticate with Apple. Please try again.'
          )
        }
      }
    } catch (e: any) {
      console.error('Apple Sign In Error:', e)

      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign In')
      } else {
        Alert.alert('Authentication Error', 'Failed to sign in with Apple. Please try again.')
      }
    } finally {
      setLoading(prev => ({ ...prev, apple: false }))
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Login</ThemedText>

      <View style={styles.buttonContainer}>
        <Button
          title={loading.guest ? 'Signing in...' : 'Guest Login'}
          onPress={handleLogin}
          disabled={loading.guest}
        />

        <TouchableOpacity
          style={[styles.googleButton, loading.google && styles.disabledButton]}
          onPress={handleGoogleLogin}
          disabled={loading.google}
        >
          {loading.google ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.googleButtonText}>Sign in with Google</ThemedText>
          )}
        </TouchableOpacity>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={[styles.appleButton, loading.apple && styles.disabledButton]}
          onPress={loading.apple ? () => {} : handleAppleLogin}
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
  disabledButton: {
    opacity: 0.6,
  },
})
