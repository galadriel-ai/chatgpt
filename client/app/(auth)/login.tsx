import { Button } from 'react-native'
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

  return (
    <ThemedView>
      <ThemedText>Login</ThemedText>
      <Button title="Login" onPress={handleLogin} />
    </ThemedView>
  )
}
