// React core
import React, { useCallback, useEffect, useState } from "react";

// React Native
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Project imports
import SwipeCard from "@/components/discover/SwipeCard";
import logger from "@/config/logger";
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import { sendLike } from "@/services/likesService";
import { getDiscoverFeed } from "@/services/discoverService";
import { Profile } from "@/types/Profile";

// Constants
const INITIAL_FETCH_LIMIT = 10;
const INITIAL_OFFSET = 0;

/**
 * Discover screen - card-based matching interface
 * Displays profiles as swipeable cards with left/right gesture support
 * Left swipe: discard, Right swipe: like (with match detection)
 */

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  logger.debug("DiscoverScreen rendered", { currentIndex, profilesCount: profiles.length });

  // Fetch initial discover feed
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const res = await getDiscoverFeed(INITIAL_FETCH_LIMIT, INITIAL_OFFSET);
    if (res.success && res.data?.profiles) {
      setProfiles(res.data.profiles);
    } else {
      Alert.alert("Error", res.error || "Failed to load profiles.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwipeLeft = useCallback(() => {
    // Discard - just move to next
    const currentProfile = profiles[currentIndex];
    logger.debug("Swiped left", { discardedUserId: currentProfile?.user_id });
    setCurrentIndex((prev) => prev + 1);
  }, [profiles, currentIndex]);

  const handleSwipeRight = useCallback(async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Optimistically move to next
    setCurrentIndex((prev) => prev + 1);

    // Send like API call
    const res = await sendLike(currentProfile.user_id);
    if (res.success) {
      logger.info("Like sent", { likedUserId: currentProfile.user_id });
      if (res.match) {
        logger.info("Match found", { matchedUserId: currentProfile.user_id, matchedName: currentProfile.name });
        Alert.alert("It's a Match!", `You matched with ${currentProfile.name}`);
      }
    }
  }, [profiles, currentIndex]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>No more profiles</Text>
        <Text style={styles.subtitle}>Check back later for more people!</Text>
      </View>
    );
  }

  // Render current card and next card (for stack effect)
  // We reverse the array slice so the current card is on top (last in render order)
  const cardsToRender = profiles.slice(currentIndex, currentIndex + 2).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardsContainer}>
        {cardsToRender.map((profile, index) => {
          const isTopCard = index === cardsToRender.length - 1;
          return (
            <View key={profile.user_id} style={styles.cardWrapper}>
              <SwipeCard
                profile={profile}
                active={isTopCard}
                onSwipeLeft={isTopCard ? handleSwipeLeft : () => {}}
                onSwipeRight={isTopCard ? handleSwipeRight : () => {}}
              />
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 16,
    textAlign: "center",
  },
});
