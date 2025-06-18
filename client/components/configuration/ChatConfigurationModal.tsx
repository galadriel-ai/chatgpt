import {
  Alert,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native'
import { ThemedView } from '@/components/theme/ThemedView'
import { ThemedText } from '@/components/theme/ThemedText'
import { ThemedButton } from '@/components/theme/ThemedButton'
import { useChat } from '@/context/ChatContext'
import { useEffect, useRef, useState } from 'react'
import { Colors } from '@/constants/Colors'
import { ChatConfiguration } from '@/types/chat'
import { ThemedChatInput } from '@/components/theme/ThemedInput'
import { useThemeColor } from '@/hooks/useThemeColor'
import { api } from '@/lib/api'

interface Props {
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
}

export function ChatConfigurationModal({ isVisible, setIsVisible }: Props) {
  const backgroundColor = useThemeColor({}, 'background')

  const { chatConfiguration, setChatConfiguration } = useChat()

  const [modifiedConfiguration, setModifiedConfiguration] = useState<ChatConfiguration | null>(null)

  const scrollViewRef = useRef<ScrollView>(null)

  const descriptionInputRef = useRef<View>(null)
  const roleInputRef = useRef<View>(null)

  useEffect(() => {
    if (modifiedConfiguration) return
    if (!chatConfiguration) return
    setModifiedConfiguration(JSON.parse(JSON.stringify(chatConfiguration)))
  }, [chatConfiguration])

  const onSave = async () => {
    if (!modifiedConfiguration) return
    const newConfiguration = await api.createChatConfiguration(modifiedConfiguration)
    if (newConfiguration) {
      setChatConfiguration(newConfiguration)
      setModifiedConfiguration(JSON.parse(JSON.stringify(newConfiguration)))
      Alert.alert('Configuration updated', 'Successfully updated the configuration')
      setIsVisible(false)
    } else {
      Alert.alert('Configuration update failed', 'Failed to save the configuration')
    }
  }

  return (
    <Modal animationType="slide" visible={isVisible} onRequestClose={() => setIsVisible(false)}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor }}
          className="flex-1 px-2 pb-10 pt-16"
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex flex-row items-center justify-between">
              <ThemedButton title="Close" onPress={() => setIsVisible(false)} />
              <ThemedText>Customize Chats</ThemedText>
              {/*TODO:*/}
              <ThemedButton title="Save" onPress={onSave} />
            </View>
            {modifiedConfiguration && (
              <View className="flex w-full flex-col gap-8 pt-10">
                <ThemedView className="flex w-full flex-col gap-2 rounded-lg">
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What should ChatGPT call you?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.userName}
                    onUpdate={(userName: string) =>
                      setModifiedConfiguration({
                        ...modifiedConfiguration,
                        userName,
                      })
                    }
                    placeholder="Name"
                    className="p-3"
                  />
                </ThemedView>
                <ThemedView className="flex w-full flex-col gap-2 rounded-lg">
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What is the assistant called?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.aiName}
                    onUpdate={(aiName: string) =>
                      setModifiedConfiguration({
                        ...modifiedConfiguration,
                        aiName,
                      })
                    }
                    placeholder="Name of the assistant"
                    className="p-3"
                  />
                </ThemedView>
                <ThemedView
                  className="flex w-full flex-col gap-2 rounded-lg"
                  ref={descriptionInputRef}
                >
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What traits should ChatGPT have?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.description}
                    onUpdate={(description: string) =>
                      setModifiedConfiguration({
                        ...modifiedConfiguration,
                        description,
                      })
                    }
                    onFocus={() => {
                      setTimeout(() => {
                        const scrollViewNode = findNodeHandle(scrollViewRef.current)
                        const descriptionNode = findNodeHandle(descriptionInputRef.current)

                        if (scrollViewNode && descriptionNode) {
                          UIManager.measureLayout(
                            descriptionNode,
                            scrollViewNode,
                            () => console.warn('Measure failed'),
                            (_x, y) => {
                              scrollViewRef.current?.scrollTo({ y: y - 320, animated: true })
                            }
                          )
                        }
                      }, 100)
                    }}
                    placeholder="Describe traits"
                    className="min-h-28 p-3"
                  />
                </ThemedView>
                <ThemedView className="flex w-full flex-col gap-2 rounded-lg" ref={roleInputRef}>
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What role does the assistant have?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.role}
                    onUpdate={(role: string) =>
                      setModifiedConfiguration({
                        ...modifiedConfiguration,
                        role,
                      })
                    }
                    onFocus={() => {
                      setTimeout(() => {
                        const scrollViewNode = findNodeHandle(scrollViewRef.current)
                        const descriptionNode = findNodeHandle(descriptionInputRef.current)

                        if (scrollViewNode && descriptionNode) {
                          UIManager.measureLayout(
                            descriptionNode,
                            scrollViewNode,
                            () => console.warn('Measure failed'),
                            (_x, y) => {
                              scrollViewRef.current?.scrollTo({ y: y - 220, animated: true })
                            }
                          )
                        }
                      }, 100)
                    }}
                    placeholder="coach, friend, teacher, therapist"
                    className="p-3"
                  />
                </ThemedView>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
