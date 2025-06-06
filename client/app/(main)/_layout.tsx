import {useRouter} from 'expo-router'
import {useAuth} from '@/context/AuthContext'
import {useEffect, useState} from 'react'
import {Drawer} from 'expo-router/drawer'
import ChatDrawerContent from '@/components/drawer/ChatDrawerContent'

export default function MainLayout() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0) // defer until next tick
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!user) {
      // prevent navigation until after layout is mounted
      router.replace('/(auth)/login')
    }
  }, [mounted, user])

  return (
    <Drawer
      screenOptions={{ headerShown: false }}
      drawerContent={props => <ChatDrawerContent {...props} />}
    >
      {/*<Drawer.Screen name="index" options={{drawerLabel: 'Home'}}/>*/}
      {/* You can add more items here later */}
    </Drawer>
  )
}
