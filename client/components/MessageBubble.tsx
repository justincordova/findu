import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { theme } from "@/constants/theme";
import { ChatMessage } from "@/types/chat";
import { useAuthStore } from "@/store/authStore";

interface MessageBubbleProps {
  message: ChatMessage;
  onDelete?: (messageId: string) => void;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  onDelete,
  showAvatar = true,
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
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      {!isOwnMessage && showAvatar && <View style={styles.avatarPlaceholder} />}

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

          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText,
            ]}
          >
            {message.message}
          </Text>

          {message.edited_at && (
            <Text style={styles.editedLabel}>(edited)</Text>
          )}

          <Text
            style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {formatTime(message.sent_at)}
          </Text>
        </Pressable>
      </Animated.View>

      {isOwnMessage && (
        <View style={styles.receiptContainer}>
          {message.is_read && (
            <Text style={styles.readReceipt}>✓✓</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    marginHorizontal: 12,
    alignItems: "flex-end",
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.skeleton,
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "80%",
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.colors.messageOtherBg || "#E5E5EA",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  otherText: {
    color: theme.colors.text,
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginBottom: 8,
  },
  editedLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: theme.colors.textSecondary,
  },
  receiptContainer: {
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 20,
  },
  readReceipt: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "600",
  },
});
