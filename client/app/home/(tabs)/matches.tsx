// React core
import React, { useCallback, useEffect, useRef, useState } from "react";

// React Native
import {
  Alert,
  AppState,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MessageCircle } from "lucide-react-native";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import ActionMenu from "@/components/shared/ActionMenu";
import AlertModal from "@/components/shared/AlertModal";
import UserProfileModal from "@/components/discover/UserProfileModal";
import { SkeletonCard } from "@/components/shared/SkeletonLoader";
import { blockUser } from "@/services/blocksService";
import { MatchesAPI } from "@/api/matches";
import { useAuthStore } from "@/store/authStore";
import { useMatchesStore } from "@/store/matchesStore";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";

// Types
interface Match {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  matched_at: string;
}

// Constants
const AVATAR_SIZE = 60;
const AVATAR_BORDER_RADIUS = 30;
const MATCH_ITEM_MARGIN_BOTTOM = 12;
const AVATAR_MARGIN_RIGHT = 16;

/**
 * Matches screen - displays list of current matches
 * Auto-polls server every 30s for new matches when tab is visible
 */
export default function MatchesScreen() {
  const { token } = useAuthStore();
  const { matches, isLoading, error, startPolling, stopPolling, removeMatch } = useMatchesStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const unmatchingMatchId = useRef<string | null>(null);
  const blockingUserId = useRef<string | null>(null);
  const isActionInProgress = useRef(false);

  // Start polling when tab becomes visible
  useFocusEffect(
    useCallback(() => {
      logger.debug("MatchesScreen: focused, starting polling");
      startPolling();

      // Subscribe to app state changes to stop polling when app is backgrounded
      const subscription = AppState.addEventListener("change", handleAppStateChange);

      return () => {
        logger.debug("MatchesScreen: unfocused, stopping polling");
        stopPolling();
        subscription.remove();
      };
    }, [startPolling, stopPolling])
  );

  const handleAppStateChange = (state: string) => {
    appStateRef.current = state;
    if (state === "active") {
      logger.debug("MatchesScreen: app active, resuming polling");
      startPolling();
    } else {
      logger.debug("MatchesScreen: app inactive, pausing polling");
      stopPolling();
    }
  };

  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const profileData = await profileApi.get(userId);
      setSelectedProfile(profileData);
      setShowProfileModal(true);
    } catch (error) {
      logger.error("Failed to load profile", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    blockingUserId.current = null;
    isActionInProgress.current = true;

    // Optimistically remove the match from the list
    const matchToRemove = matches.find((m) => m.otherUser.id === userId);
    if (matchToRemove) {
      removeMatch(matchToRemove.id);
    }

    try {
      const result = await blockUser(userId);
      if (result.success) {
        logger.info("User blocked from matches", { userId });
      } else {
        logger.error("Failed to block user", { error: result.error });
        // Refetch to restore the match if the action failed
        useMatchesStore.getState().fetchMatches();
        Alert.alert("Error", result.error || "Failed to block user");
      }
    } finally {
      isActionInProgress.current = false;
    }
  };

  const handleUnmatch = async (matchId: string) => {
    unmatchingMatchId.current = null;
    isActionInProgress.current = true;

    // Optimistically remove the match from the list
    removeMatch(matchId);

    try {
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        // Refetch to restore the match if token is missing
        useMatchesStore.getState().fetchMatches();
        return;
      }
      await MatchesAPI.unmatch(token, matchId);
      logger.info("Match removed", { matchId });
    } catch (error) {
      logger.error("Failed to unmatch", { error });
      // Refetch to restore the match if the action failed
      useMatchesStore.getState().fetchMatches();
      Alert.alert("Error", "Failed to unmatch. Please try again.");
    } finally {
      isActionInProgress.current = false;
    }
  };

  const renderItem = ({ item }: { item: Match }) => (
    <View style={styles.matchItem}>
      <TouchableOpacity
        style={styles.matchContent}
        onPress={() => handleViewProfile(item.otherUser.id)}
        disabled={isActionInProgress.current || loadingProfile}
      >
        <Image source={{ uri: item.otherUser.avatar_url }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.otherUser.name}</Text>
          <Text style={styles.timestamp}>
            Matched on {new Date(item.matched_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => {
          logger.info("Chat with match", { userId: item.otherUser.id });
          // TODO: Navigate to chat with this user
        }}
        disabled={isActionInProgress.current}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Message ${item.otherUser.name}`}
      >
        <MessageCircle size={24} color={PRIMARY} />
      </TouchableOpacity>

      <ActionMenu
        options={[
          {
            label: "Unmatch",
            icon: "close",
            onPress: () => {
              unmatchingMatchId.current = item.id;
            },
            destructive: true,
          },
          {
            label: "Block User",
            icon: "ban",
            onPress: () => {
              blockingUserId.current = item.otherUser.id;
            },
            destructive: true,
          },
        ]}
      />
    </View>
  );

  if (isLoading && matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>Matches</Text>
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
      <Text style={styles.headerTitle}>Matches</Text>
      {matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No matches yet.</Text>
          <Text style={styles.subtitle}>Keep swiping to find people!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      <AlertModal
        visible={unmatchingMatchId.current !== null && !isActionInProgress.current}
        title="Unmatch?"
        message="You will no longer be able to message this person. You can still see them in discover if you want to connect again."
        type="warning"
        onConfirm={() => handleUnmatch(unmatchingMatchId.current!)}
        onClose={() => !isActionInProgress.current && (unmatchingMatchId.current = null)}
      />
      <AlertModal
        visible={blockingUserId.current !== null && !isActionInProgress.current}
        title="Block User"
        message="This person will be removed from your matches and you won't see each other anymore."
        type="warning"
        onConfirm={() => handleBlockUser(blockingUserId.current!)}
        onClose={() => !isActionInProgress.current && (blockingUserId.current = null)}
      />
      <UserProfileModal
        visible={showProfileModal}
        profile={selectedProfile}
        onClose={() => setShowProfileModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: MATCH_ITEM_MARGIN_BOTTOM,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    flex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    marginRight: AVATAR_MARGIN_RIGHT,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
  },
  timestamp: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  chatButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 16,
  },
});
