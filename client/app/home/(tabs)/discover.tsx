import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BACKGROUND, DARK, MUTED, PRIMARY } from "../../../constants/theme";
import { getDiscoverFeed } from "@/services/discoverService";
import { sendLike } from "@/services/likesService";
import SwipeCard from "@/components/discover/SwipeCard";
import { Profile } from "@/types/Profile";
import logger from "@/config/logger";

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  logger.info(`DiscoverScreen: Rendering with currentIndex=${currentIndex}, profiles.length=${profiles.length}`);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const res = await getDiscoverFeed(10, 0);
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
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleSwipeRight = useCallback(async () => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Optimistically move to next
    setCurrentIndex((prev) => prev + 1);

    // Send like API call
    const res = await sendLike(currentProfile.user_id);
    if (res.success && res.match) {
      Alert.alert("It's a Match!", `You matched with ${currentProfile.name}`);
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
