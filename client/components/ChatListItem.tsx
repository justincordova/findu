import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { MatchWithLastMessage } from "@/store/matchStore";

interface ChatListItemProps {
  match: MatchWithLastMessage;
  onDelete?: (matchId: string) => void;
}

export function ChatListItem({ match, onDelete }: ChatListItemProps) {
  const router = useRouter();
  const { lastMessage, otherUserName, otherUserImage } = match;
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    router.push({
      pathname: "/chat-detail",
      params: { matchId: match.id, userName: otherUserName || "User" },
    });
  };

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isUnread = lastMessage && !lastMessage.isRead && !lastMessage.senderIsMe;
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncateText = (text: string, length: number = 50) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  const previewText = lastMessage
    ? `${lastMessage.senderIsMe ? "You: " : ""}${truncateText(lastMessage.text)}`
    : "No messages yet";

  return (
    <Menu>
      <MenuTrigger>
        <Animated.View style={[{ transform: [{ scale: pressAnim }] }]}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.container, isUnread && styles.unreadBg]}
            accessible={true}
            accessibilityLabel={`Chat with ${otherUserName}`}
            accessibilityRole="button"
          >
            {/* Avatar */}
            <Image
              source={{
                uri: otherUserImage || "https://via.placeholder.com/50",
              }}
              style={styles.avatar}
            />

            {/* Content */}
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text
                  style={[styles.userName, isUnread && styles.unreadName]}
                  numberOfLines={1}
                >
                  {otherUserName || "User"}
                </Text>
                <Text style={styles.timestamp}>
                  {lastMessage ? formatTime(lastMessage.sentAt) : ""}
                </Text>
              </View>

              <Text
                style={[
                  styles.messagePreview,
                  isUnread && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {previewText}
              </Text>
            </View>

            {/* Status Indicators */}
            <View style={styles.rightContainer}>
              {isUnread && <View style={styles.unreadDot} />}
              {!isUnread &&
                lastMessage?.senderIsMe &&
                lastMessage?.isRead && (
                  <Text style={styles.readReceipt}>✓✓</Text>
                )}
            </View>
          </Pressable>
        </Animated.View>
      </MenuTrigger>

      {/* Context Menu */}
      <MenuOptions
        customStyles={{
          optionsContainer: styles.menuContainer,
        }}
      >
        <MenuOption
          onSelect={() => onDelete?.(match.id)}
          text="Delete"
          customStyles={{
            optionText: styles.menuDelete,
          }}
        />
        <MenuOption
          onSelect={() => {
            /* Archive functionality */
          }}
          text="Archive"
          customStyles={{
            optionText: styles.menuOption,
          }}
        />
      </MenuOptions>
    </Menu>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  unreadBg: {
    backgroundColor: theme.colors.unreadBg || "rgba(0, 122, 255, 0.05)",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: theme.colors.skeleton,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  messagePreview: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessage: {
    color: theme.colors.text,
    fontWeight: "500",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 24,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  readReceipt: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
  },
  menuOption: {
    color: theme.colors.text,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuDelete: {
    color: theme.colors.error,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
