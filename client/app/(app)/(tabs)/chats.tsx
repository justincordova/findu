import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  SafeAreaView,
} from "react-native";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useMatchStore, MatchWithLastMessage } from "@/store/matchStore";
import { ChatListItem } from "@/components/ChatListItem";
import { SkeletonGroup } from "@/components/shared/SkeletonLoader";
import { ChatsAPI } from "@/api/chats";
import { MatchesAPI } from "@/api/matches";

export default function ChatsScreen() {
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);
  const { matches, setMatches } = useMatchStore();
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Load matches and fetch last message for each
  useEffect(() => {
    const loadMatches = async () => {
      if (!userId || !token) return;

      setIsLoadingMatches(true);
      try {
        // Fetch matches from API
        const response = await MatchesAPI.getMatches(token);
        if (!response.matches) {
          setMatches([]);
          return;
        }

        const matchesWithMessages = await Promise.all(
          response.matches.map(async (match: any) => {
            const lastMessage = await ChatsAPI.getLatestMessage(match.id);
            const otherUserId = match.user1 === userId ? match.user2 : match.user1;
            const otherUser = match.otherUser || {};

            return {
              ...match,
              lastMessage: lastMessage
                ? {
                    text: lastMessage.message,
                    sentAt: lastMessage.sent_at,
                    isRead: lastMessage.is_read,
                    senderIsMe: lastMessage.sender_id === userId,
                  }
                : undefined,
              otherUserId,
              otherUserName: otherUser.name,
              otherUserImage: otherUser.avatar_url,
            };
          })
        );

        // Sort by latest message (newest first)
        matchesWithMessages.sort((a, b) => {
          const aTime = a.lastMessage?.sentAt
            ? new Date(a.lastMessage.sentAt).getTime()
            : 0;
          const bTime = b.lastMessage?.sentAt
            ? new Date(b.lastMessage.sentAt).getTime()
            : 0;
          return bTime - aTime;
        });

        setMatches(matchesWithMessages as MatchWithLastMessage[]);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatches();
  }, [userId, token, setMatches]);

  const handleDeleteChat = async (matchId: string) => {
    try {
      // Optional: Implement delete/archive functionality
      console.log("Delete chat:", matchId);
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Loading state with skeleton
  if (isLoadingMatches) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.skeletonContainer}>
          <SkeletonGroup count={6} spacing={0} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!matches || matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyDescription}>
            No matches yet. Start swiping to meet someone!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{matches.length} conversation</Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem match={item} onDelete={handleDeleteChat} />
        )}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  skeletonContainer: {
    paddingHorizontal: 0,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.border,
  },
});
