import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Text,
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
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedMedia) return;

    setLoading(true);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
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

  return (
    <View>
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>typing</Text>
          <View style={styles.dots}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: new Animated.Value(1),
                },
              ]}
            />
            <Animated.View style={[styles.dot, { marginLeft: 4 }]} />
            <Animated.View style={[styles.dot, { marginLeft: 4 }]} />
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
            <Ionicons name="close" size={18} color="#fff" />
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
            name="image"
            size={20}
            color={disabled || loading ? theme.colors.textSecondary : theme.colors.primary}
          />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
          disabled={disabled || loading}
          editable={!disabled && !loading}
        />

        <Animated.View
          style={[
            styles.sendButton,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable
            onPress={handleSend}
            disabled={disabled || loading || (!text.trim() && !selectedMedia)}
            style={[
              styles.sendButtonPress,
              (disabled ||
                loading ||
                (!text.trim() && !selectedMedia)) && styles.sendButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonPress: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    position: "relative",
    marginHorizontal: 12,
    marginBottom: 8,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: 4,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});
