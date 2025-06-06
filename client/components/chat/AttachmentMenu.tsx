import React, { useEffect } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing
} from 'react-native-reanimated'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'
import { FolderIcon, CameraIcon, PhotoIcon } from '@/components/icons/Icons'
import { useThemeColor } from '@/hooks/useThemeColor'

interface AttachmentMenuProps {
  visible: boolean
  onClose: () => void
  onSelectFiles: () => void
  onSelectCamera: () => void
  onSelectPhotos: () => void
}

export function AttachmentMenu({
  visible,
  onClose,
  onSelectFiles,
  onSelectCamera,
  onSelectPhotos,
}: AttachmentMenuProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary')
  const borderColor = useThemeColor({}, 'border')
  
  const [modalVisible, setModalVisible] = React.useState(false)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const translateY = useSharedValue(20)

  const handleClose = () => {
    // Start close animation
    opacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) })
    scale.value = withTiming(0.1, { duration: 150, easing: Easing.in(Easing.quad) })
    translateY.value = withTiming(40, { duration: 150, easing: Easing.in(Easing.quad) })
    
    // Use setTimeout instead of animation callback to avoid race conditions
    setTimeout(() => {
      setModalVisible(false)
      onClose()
    }, 150)
  }

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      // Start open animation
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
      scale.value = withSpring(1, { damping: 15, stiffness: 200 })
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 })
    } else if (modalVisible) {
      handleClose()
    }
  }, [visible])

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }))

  const MenuItem = ({ 
    icon, 
    title, 
    onPress 
  }: { 
    icon: React.ReactNode
    title: string
    onPress: () => void 
  }) => (
    <Pressable onPress={onPress}>
      <ThemedView 
        className="flex flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomColor: borderColor, borderBottomWidth: 0.5 }}
      >
        <ThemedText className="text-base">{title}</ThemedText>
        {icon}
      </ThemedView>
    </Pressable>
  )

  if (!modalVisible) return null

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        className="flex-1" 
        style={[
          { backgroundColor: 'rgba(0, 0, 0, 0.3)' },
          overlayAnimatedStyle
        ]}
      >
        <Pressable className="flex-1" onPress={handleClose} />
        <Animated.View 
          className="absolute bottom-32 left-4" 
          style={[{ width: 200 }, menuAnimatedStyle]}
        >
          <ThemedView 
            className="rounded-2xl shadow-lg"
            style={{ 
              backgroundColor,
              borderColor,
              borderWidth: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}
          >
            <MenuItem
              icon={<FolderIcon />}
              title="Files"
              onPress={async () => {
                await onSelectFiles()
                handleClose()
              }}
            />
            <MenuItem
              icon={<CameraIcon />}
              title="Camera"
              onPress={async () => {
                await onSelectCamera()
                handleClose()
              }}
            />
            <View className="overflow-hidden rounded-b-2xl">
              <MenuItem
                icon={<PhotoIcon />}
                title="Photos"
                onPress={async () => {
                  await onSelectPhotos()
                  handleClose()
                }}
              />
            </View>
          </ThemedView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
} 