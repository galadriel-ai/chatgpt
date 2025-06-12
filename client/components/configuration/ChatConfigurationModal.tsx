import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
  View
} from "react-native";
import {ThemedView} from "@/components/theme/ThemedView";
import {ThemedText} from "@/components/theme/ThemedText";
import {ThemedButton} from "@/components/theme/ThemedButton";
import {useChat} from "@/context/ChatContext";
import {useEffect, useRef, useState} from "react";
import {Colors} from "@/constants/Colors";
import {ChatConfiguration} from "@/types/chat";
import {ThemedChatInput} from "@/components/theme/ThemedInput";
import {useThemeColor} from "@/hooks/useThemeColor";
import {api} from "@/lib/api";

interface Props {
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
}

export function ChatConfigurationModal(
  {isVisible, setIsVisible}: Props
) {
  const backgroundColor = useThemeColor({}, 'background')

  const {chatConfiguration, setChatConfiguration} = useChat()

  const [modifiedConfiguration, setModifiedConfiguration] = useState<ChatConfiguration | null>(null)

  const [isToggled, setIsToggled] = useState<boolean>(false)

  const scrollViewRef = useRef<ScrollView>(null)


  useEffect(() => {
    if (modifiedConfiguration) return
    if (!chatConfiguration) return
    setModifiedConfiguration(
      JSON.parse(JSON.stringify(chatConfiguration))
    )
  }, [chatConfiguration]);


  const onSave = async () => {
    console.log("onSave")
    if (!modifiedConfiguration) return
    const newConfiguration = await api.createChatConfiguration(modifiedConfiguration)
    if (newConfiguration) {
      console.log("YEEES")
      setChatConfiguration(newConfiguration)
      setModifiedConfiguration(
        JSON.parse(JSON.stringify(newConfiguration))
      )
    } else {
      console.log("NOOO")
    }
  }

  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      onRequestClose={() => setIsVisible(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1, backgroundColor}}
          className="flex-1 px-2 pb-10 pt-16"
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{paddingBottom: 200}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              className="flex flex-row justify-between items-center"
            >
              <ThemedButton title="Close" onPress={() => setIsVisible(false)}/>
              <ThemedText>Customize Chats</ThemedText>
              {/*TODO:*/}
              <ThemedButton title="Save" onPress={onSave}/>
            </View>
            {modifiedConfiguration &&
              <View className="flex flex-col w-full pt-10 gap-8">
                <ThemedView
                  className="flex flex-row justify-between items-center w-full rounded-lg p-4"
                  lightColor={Colors.light.backgroundHighlight}
                  darkColor={Colors.dark.backgroundHighlight}
                >
                  <ThemedText>
                    Enable for new chats
                  </ThemedText>
                  <Switch
                    value={isToggled}
                    onValueChange={(value) => setIsToggled(value)}
                  />
                </ThemedView>
                <ThemedView
                  className="flex flex-col gap-2 w-full rounded-lg"
                >
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What should ChatGPT call you?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.userName}
                    onUpdate={(userName: string) => setModifiedConfiguration({
                      ...modifiedConfiguration, userName
                    })}
                    placeholder="Name"
                    className="p-3"
                  />
                </ThemedView>
                <ThemedView
                  className="flex flex-col gap-2 w-full rounded-lg"
                >
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What is the assistant called?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.aiName}
                    onUpdate={(aiName: string) => setModifiedConfiguration({
                      ...modifiedConfiguration, aiName
                    })}
                    placeholder="Name of the assistant"
                    className="p-3"
                  />
                </ThemedView>
                <ThemedView
                  className="flex flex-col gap-2 w-full rounded-lg"
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
                    onUpdate={(description: string) => setModifiedConfiguration({
                      ...modifiedConfiguration, description
                    })}
                    placeholder="Describe traits"
                    className="p-3 min-h-28"
                  />
                </ThemedView>
                <ThemedView
                  className="flex flex-col gap-2 w-full rounded-lg"
                >
                  <ThemedText
                    className="pl-2"
                    lightColor={Colors.light.textSecondary}
                    darkColor={Colors.dark.textSecondary}
                  >
                    What role does the assistant have?
                  </ThemedText>
                  <ThemedChatInput
                    value={modifiedConfiguration.role}
                    onUpdate={(role: string) => setModifiedConfiguration({
                      ...modifiedConfiguration, role
                    })}
                    placeholder="coach, friend. teacher, therapist"
                    className="p-3"
                  />
                </ThemedView>
              </View>
            }
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  )
}