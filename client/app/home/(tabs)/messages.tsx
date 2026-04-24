import { useFocusEffect, useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatsAPI } from "@/api/chats";
import { MatchesAPI } from "@/api/matches";
import { SkeletonCard } from "@/components/shared/SkeletonLoader";
import logger from "@/config/logger";
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types/chat";

interface Match {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  matched_at: string;
}

interface ChatPreview extends Match {
  lastMessage?: ChatMessage;
}

const AVATAR_SIZE = 60;
const AVATAR_BORDER_RADIUS = 30;

export default function MessagesScreen() {
  const router = useRouter();
  const { token, userId } = useAuthStore();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // API returns array directly, not wrapped in object
      const matches = (await MatchesAPI.getMatches(token)) as Match[];

      // Fetch latest message for each match
      const chatsWithMessages = await Promise.all(
        matches.map(async (match: Match) => {
          try {
            const lastMessage = await ChatsAPI.getLatestMessage(match.id);
            return {
              ...match,
              lastMessage: lastMessage || undefined,
            };
          } catch (_error) {
            // 404 is expected when no messages exist yet
            return { ...match };
          }
        }),
      );

      // Sort by latest message timestamp, then by matched_at
      const sortedChats = chatsWithMessages.sort(
        (a: ChatPreview, b: ChatPreview) => {
          const aTime = a.lastMessage?.sent_at || a.matched_at;
          const bTime = b.lastMessage?.sent_at || b.matched_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        },
      );

      setChats(sortedChats);
    } catch (error) {
      logger.error("Error fetching chats", { error });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch chats when tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats]),
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => {
    const hasUnread =
      item.lastMessage &&
      !item.lastMessage.is_read &&
      item.lastMessage.sender_id !== userId;

    return (
      <TouchableOpacity
        style={[styles.chatItem, hasUnread && styles.chatItemUnread]}
        onPress={() => {
          router.push({
            pathname: "/(app)/chat-detail",
            params: {
              matchId: item.id,
              userName: item.otherUser.name,
            },
          });
        }}
      >
        <Image
          source={{ uri: item.otherUser.avatar_url }}
          style={styles.avatar}
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]}>
              {item.otherUser.name}
            </Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.lastMessage.sent_at)}
              </Text>
            )}
          </View>
          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                hasUnread && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage
                ? item.lastMessage.sender_id === userId
                  ? `You: ${item.lastMessage.message}`
                  : item.lastMessage.message
                : "Start a conversation..."}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.listContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Chats</Text>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={MUTED} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.subtitle}>
            Match with someone to start chatting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItemUnread: {
    backgroundColor: "rgba(168, 85, 247, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.1)",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: DARK,
  },
  nameUnread: {
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: MUTED,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: 14,
    color: MUTED,
    flex: 1,
  },
  lastMessageUnread: {
    color: DARK,
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 16,
    textAlign: "center",
  },
});
