import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { theme } from "@/constants/theme";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MessageInputProps {
  onSend: (text: string, mediaUrl?: string) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  otherUserTyping?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  otherUserTyping,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typingTimer, setTypingTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [inputHeight, setInputHeight] = useState(40);

  // Animation values
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const sendButtonRotate = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const mediaPreviewScale = useRef(new Animated.Value(0)).current;

  // Typing indicator animation
  useEffect(() => {
    if (otherUserTyping) {
      const createDotAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        );
      };

      const animations = Animated.parallel([
        createDotAnimation(typingDot1, 0),
        createDotAnimation(typingDot2, 133),
        createDotAnimation(typingDot3, 266),
      ]);

      animations.start();

      return () => animations.stop();
    } else {
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
    }
  }, [
    otherUserTyping,
    typingDot3,
    typingDot2.setValue,
    typingDot2,
    typingDot1.setValue,
    typingDot1,
  ]);

  // Media preview animation
  useEffect(() => {
    if (selectedMedia) {
      Animated.spring(mediaPreviewScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      mediaPreviewScale.setValue(0);
    }
  }, [selectedMedia, mediaPreviewScale.setValue, mediaPreviewScale]);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Emit typing
    if (!typingTimer && newText.length > 0) {
      onTyping?.();
    }

    // Reset typing timer
    if (typingTimer) clearTimeout(typingTimer);

    const timer = setTimeout(() => {
      onStopTyping?.();
      setTypingTimer(null);
    }, 3000);

    setTypingTimer(timer);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setSelectedMedia(uri);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedMedia) return;

    setLoading(true);

    // Send button animation
    Animated.parallel([
      Animated.sequence([
        Animated.spring(sendButtonScale, {
          toValue: 0.85,
          tension: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sendButtonScale, {
          toValue: 1,
          tension: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(sendButtonRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onSend(text, selectedMedia || undefined);
      setText("");
      setSelectedMedia(null);
      onStopTyping?.();
      sendButtonRotate.setValue(0);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const canSend = !disabled && !loading && (text.trim() || selectedMedia);

  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(168, 85, 247, 0.12)", "rgba(168, 85, 247, 0.4)"],
  });

  const inputBackgroundColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.95)"],
  });

  const sendRotation = sendButtonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dotTranslate = (animValue: Animated.Value) =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

  const dotOpacity = (animValue: Animated.Value) =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    });

  return (
    <View style={styles.wrapper}>
      {/* Typing Indicator */}
      {otherUserTyping && (
        <Animated.View
          style={[
            styles.typingIndicator,
            {
              opacity: otherUserTyping ? 1 : 0,
            },
          ]}
        >
          <View style={styles.typingBubble}>
            <View style={styles.dots}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ translateY: dotTranslate(typingDot1) }],
                    opacity: dotOpacity(typingDot1),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ translateY: dotTranslate(typingDot2) }],
                    opacity: dotOpacity(typingDot2),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ translateY: dotTranslate(typingDot3) }],
                    opacity: dotOpacity(typingDot3),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Media Preview */}
      {selectedMedia && (
        <Animated.View
          style={[
            styles.previewContainer,
            {
              transform: [{ scale: mediaPreviewScale }],
            },
          ]}
        >
          <View style={styles.previewWrapper}>
            <Image source={{ uri: selectedMedia }} style={styles.preview} />
            <Pressable
              onPress={() => setSelectedMedia(null)}
              style={styles.removeButton}
              hitSlop={8}
            >
              <View style={styles.removeButtonInner}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Add Media Button */}
        <Pressable
          onPress={handlePickImage}
          disabled={disabled || loading}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          hitSlop={8}
        >
          <View
            style={[
              styles.iconButtonInner,
              (disabled || loading) && styles.iconButtonDisabled,
            ]}
          >
            <Ionicons
              name="add"
              size={24}
              color={
                disabled || loading
                  ? theme.colors.textSecondary
                  : theme.colors.primary
              }
            />
          </View>
        </Pressable>

        {/* Text Input */}
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor: inputBorderColor,
              backgroundColor: inputBackgroundColor,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { height: Math.max(40, inputHeight) }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            value={text}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onContentSizeChange={(e) => {
              setInputHeight(e.nativeEvent.contentSize.height);
            }}
            multiline
            maxLength={500}
            editable={!disabled && !loading}
          />
        </Animated.View>

        {/* Send Button */}
        <Animated.View
          style={[
            {
              transform: [{ scale: sendButtonScale }, { rotate: sendRotation }],
            },
          ]}
        >
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              canSend && styles.sendButtonActive,
              pressed && canSend && styles.sendButtonPressed,
            ]}
            hitSlop={8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={24}
                color={canSend ? "#FFFFFF" : theme.colors.textSecondary}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
    gap: 10,
  },
  iconButton: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  iconButtonDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    letterSpacing: 0.3,
    fontWeight: "400",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sendButtonPressed: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  previewContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  previewWrapper: {
    position: "relative",
    alignSelf: "flex-start",
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: theme.colors.skeleton,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  removeButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  typingIndicator: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  typingBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(168, 85, 247, 0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
