import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Text,
  Pressable,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { SkeletonGroup } from "@/components/shared/SkeletonLoader";
import { ChatsAPI } from "@/api/chats";
import {
  initializeSocket,
  joinMatch,
  leaveMatch,
  sendMessageSocket,
  markReadSocket,
  emitTyping,
  emitStopTyping,
} from "@/utils/socketClient";

export default function ChatDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId, userName } = route.params as {
    matchId: string;
    userName: string;
  };
  const userId = useAuthStore((state) => state.userId);
  const {
    conversations,
    setCurrentMatch,
    setMessages,
    setLoading,
    deleteMessage: deleteMessageStore,
  } = useChatStore();

  const conversation = conversations[matchId];
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Find the latest message from current user for read receipt display
  const latestOwnMessageId = conversation?.messages
    ?.slice()
    .reverse()
    .find((msg) => msg.sender_id === userId)?.id;

  // Initialize Socket.IO and fetch initial messages
  useEffect(() => {
    // Set as current match
    setCurrentMatch(matchId);

    // Initialize Socket.IO
    initializeSocket();

    // Join match room
    joinMatch(matchId);

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(matchId, true);
      try {
        const messages = await ChatsAPI.getChatHistory(matchId, 50);
        setMessages(matchId, messages);

        // Mark as read
        await ChatsAPI.markMessagesAsRead(matchId);
        markReadSocket(matchId);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(matchId, false);
      }
    };

    fetchMessages();

    // Set navigation title
    navigation.setOptions({ title: userName });

    // Cleanup on unmount
    return () => {
      leaveMatch(matchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSendMessage = async (text: string, mediaUrl?: string) => {
    try {
      // Send via both API and Socket.IO
      // API for persistence, Socket for real-time delivery to both users
      await ChatsAPI.sendMessage(matchId, text, mediaUrl);
      sendMessageSocket(matchId, text, mediaUrl);
      // Message will be added via socket listener when received from server
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ChatsAPI.deleteMessage(messageId);
      deleteMessageStore(matchId, messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleLoadMore = async () => {
    if (!conversation || !conversation.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const olderMessages = await ChatsAPI.getChatHistory(
        matchId,
        50,
        conversation.cursor
      );

      if (olderMessages.length > 0) {
        setMessages(matchId, [...olderMessages, ...conversation.messages]);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const messages = await ChatsAPI.getChatHistory(matchId, 50);
      setMessages(matchId, messages);
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
        </View>
        <View style={styles.skeletonContainer}>
          <SkeletonGroup count={8} spacing={12} />
        </View>
        <MessageInput disabled onSend={async () => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{userName}</Text>
          {conversation.otherUserOnline && (
            <Text style={styles.onlineStatus}>Active now</Text>
          )}
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={conversation.messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageBubble
            message={item}
            onDelete={handleDeleteMessage}
            showAvatar={
              index === conversation.messages.length - 1 ||
              conversation.messages[index + 1]?.sender_id !== item.sender_id
            }
            isLatestOwnMessage={item.id === latestOwnMessageId}
          />
        )}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          conversation.isLoading ? (
            <View style={styles.emptyLoading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          )
        }
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={() => emitTyping(matchId)}
        onStopTyping={() => emitStopTyping(matchId)}
        disabled={conversation.isLoading}
        otherUserTyping={conversation.userTyping}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
    fontWeight: "500",
  },
  skeletonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyLoading: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
