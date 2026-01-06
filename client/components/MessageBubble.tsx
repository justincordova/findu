import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { ChatMessage } from "@/types/chat";
import { useAuthStore } from "@/store/authStore";

interface MessageBubbleProps {
  message: ChatMessage;
  onDelete?: (messageId: string) => void;
  showAvatar?: boolean;
  isLatestOwnMessage?: boolean;
}

export function MessageBubble({
  message,
  onDelete,
  showAvatar = true,
  isLatestOwnMessage = false,
}: MessageBubbleProps) {
  const userId = useAuthStore((state) => state.userId);
  const isOwnMessage = message.sender_id === userId;
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLongPress = () => {
    if (isOwnMessage) {
      Alert.alert("Message Options", "", [
        {
          text: "Delete",
          onPress: () => onDelete?.(message.id),
          style: "destructive",
        },
        {
          text: "Copy",
          onPress: () => {
            // Copy to clipboard functionality can be added here
          },
        },
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
      ]);
    }
  };

  return (
    <View
      style={[
        styles.messageWrapper,
        isOwnMessage ? styles.ownWrapper : styles.otherWrapper,
      ]}
    >
      <View
        style={[
          styles.container,
          isOwnMessage ? styles.ownContainer : styles.otherContainer,
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
          </View>
        )}

        <Animated.View
          style={[
            {
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            style={[
              styles.bubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            {message.media_url && (
              <Image
                source={{ uri: message.media_url }}
                style={styles.media}
              />
            )}

            <View style={styles.messageContent}>
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownText : styles.otherText,
                ]}
              >
                {message.message}
              </Text>

              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.timestamp,
                    isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
                  ]}
                >
                  {formatTime(message.sent_at)}
                  {message.edited_at && " • edited"}
                </Text>

                {isOwnMessage && isLatestOwnMessage && (
                  <Ionicons
                    name={message.is_read ? "checkmark-done" : "checkmark"}
                    size={14}
                    color="rgba(255, 255, 255, 0.7)"
                    style={styles.readIcon}
                  />
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    flexDirection: "column",
    marginVertical: 2,
    marginHorizontal: 16,
  },
  ownWrapper: {
    alignItems: "flex-end",
  },
  otherWrapper: {
    alignItems: "flex-start",
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.1)",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.08)",
  },
  messageContent: {
    flexDirection: "column",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  ownText: {
    color: "#FFFFFF",
  },
  otherText: {
    color: theme.colors.text,
  },
  media: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.65)",
  },
  otherTimestamp: {
    color: theme.colors.textSecondary,
  },
  readIcon: {
    marginLeft: 2,
  },
});
