import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "@/constants/theme";

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
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onSend(text, selectedMedia || undefined);
      setText("");
      setSelectedMedia(null);
      onStopTyping?.();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const canSend = !disabled && !loading && (text.trim() || selectedMedia);

  return (
    <View style={styles.wrapper}>
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <View style={styles.dots}>
              <Animated.View style={[styles.dot]} />
              <Animated.View style={[styles.dot, { marginLeft: 3 }]} />
              <Animated.View style={[styles.dot, { marginLeft: 3 }]} />
            </View>
          </View>
        </View>
      )}

      {selectedMedia && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedMedia }} style={styles.preview} />
          <Pressable
            onPress={() => setSelectedMedia(null)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={24} color="rgba(0, 0, 0, 0.6)" />
          </Pressable>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Pressable
          onPress={handlePickImage}
          disabled={disabled || loading}
          style={styles.iconButton}
        >
          <Ionicons
            name="add-circle"
            size={28}
            color={disabled || loading ? theme.colors.textSecondary : theme.colors.primary}
          />
        </Pressable>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSecondary}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            disabled={disabled || loading}
            editable={!disabled && !loading}
          />
        </View>

        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={[
              styles.sendButton,
              canSend && styles.sendButtonActive,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={22}
                color={canSend ? "#fff" : theme.colors.textSecondary}
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(168, 85, 247, 0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  iconButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 80,
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  previewContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: theme.colors.skeleton,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  typingBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.1)",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
});
