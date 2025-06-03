import { View, Text, Button } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = () => {
    login({ name: 'User' })
    router.replace('/(main)')
  }

  return (
    <View>
      <Text>Login</Text>
      <Button title="Login" onPress={handleLogin} />
    </View>
  )
}
