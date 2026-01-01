// React core
import React, { useCallback, useEffect, useRef, useState } from "react";

// React Native
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Navigation & Hooks
import { useFocusEffect } from "@react-navigation/native";

// Project imports
import SwipeCard from "@/components/discover/SwipeCard";
import UserProfileModal from "@/components/discover/UserProfileModal";
import { SkeletonCard } from "@/components/shared/SkeletonLoader";
import logger from "@/config/logger";
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import { sendLike } from "@/services/likesService";
import { getDiscoverFeed } from "@/services/discoverService";
import { profileApi } from "@/api/profile";
import { useDiscoverPreferencesStore } from "@/store/discoverPreferencesStore";
import { Profile } from "@/types/Profile";

// Constants
const INITIAL_FETCH_LIMIT = 10;
const INITIAL_OFFSET = 0;

/**
 * Discover Screen
 *
 * Card-based matching interface with smart refetch logic.
 *
 * Features:
 * - Smart refetch: Only when out of profiles OR hard filters changed
 * - Pull-to-refresh: Available on "No more profiles" screen
 * - Hard filter tracking: Detects age range / gender preference changes
 * - Automatic refetch on tab focus (when conditions met)
 * - Comprehensive logging for debugging
 *
 * Refetch Conditions:
 * 1. User has swiped through all profiles (out of profiles)
 * 2. User changed age range or gender preferences on profile page
 * 3. User manually triggers pull-to-refresh (on "No more profiles" screen)
 *
 * Note: Pull-to-refresh is available on the "No more profiles" screen to allow
 * users to refresh when they run out of cards. During active swiping, users can
 * still manually trigger refetch by switching tabs and returning (if conditions met).
 *
 * Architecture:
 * - discover.tsx: UI and refetch orchestration
 * - discoverPreferencesStore: Tracks preference changes
 * - discoverService: API calls
 */

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Store for tracking preference changes
  const { hardFiltersChanged, updateHardFilters, initializeHardFilters } = useDiscoverPreferencesStore();

  // Keep reference to current profile for hard filter comparison
  const currentProfileRef = useRef<Partial<Profile> | null>(null);

  // Refresh button animation
  const refreshRotation = useRef(new Animated.Value(0)).current;

  // Track animation to prevent memory leaks
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Track if component has initialized to prevent double fetch on mount
  const hasInitializedRef = useRef(false);

  /**
   * Fetch discover feed with smart hard filter tracking
   * Logs all key events and updates hard filter baselines after successful fetch
   */
  const fetchProfiles = useCallback(async () => {
    logger.debug("[discover] Fetching profiles", { limit: INITIAL_FETCH_LIMIT, offset: INITIAL_OFFSET });
    setLoading(true);

    try {
      // Fetch current profile to get latest preferences and initialize/compare hard filters
      const profile = await profileApi.me();

      // Initialize hard filters on first load (check if currentProfileRef is null)
      if (!currentProfileRef.current) {
        logger.debug("[discover] Initializing hard filters on first load", {
          minAge: profile.min_age,
          maxAge: profile.max_age,
          genderPreference: profile.gender_preference,
        });
        initializeHardFilters(profile.min_age, profile.max_age, profile.gender_preference);
      }

      currentProfileRef.current = profile;

      // Fetch discover feed
      const res = await getDiscoverFeed(INITIAL_FETCH_LIMIT, INITIAL_OFFSET);

      if (res.success && res.data?.profiles) {
        logger.info("[discover] Profiles fetched successfully", { count: res.data.profiles.length });
        setProfiles(res.data.profiles);
        setCurrentIndex(0); // Reset to first card on refetch

        // Mark as initialized after first successful fetch to prevent double fetch on mount
        hasInitializedRef.current = true;

        // Update hard filter baselines after successful fetch
        updateHardFilters(profile.min_age, profile.max_age, profile.gender_preference);
      } else {
        logger.error("[discover] Failed to fetch profiles", { error: res.error });
        Alert.alert("Error", res.error || "Failed to load profiles.");
      }
    } catch (err) {
      logger.error("[discover] Error fetching profiles", {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert("Error", "Failed to load profiles. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initializeHardFilters, updateHardFilters]);

  /**
   * Determine if refetch is needed based on current state
   * Returns true if:
   * 1. User has run out of profiles (out of profiles)
   * 2. User changed hard filters (age range or gender preference)
   */
  const shouldRefetch = useCallback(async (): Promise<boolean> => {
    // Skip refetch check on initial load - useEffect handles the first fetch
    if (!hasInitializedRef.current) {
      return false;
    }

    // Condition 1: Out of profiles
    const outOfProfiles = currentIndex >= profiles.length;
    if (outOfProfiles) {
      logger.debug("[discover] Should refetch: out of profiles", { currentIndex, profilesLength: profiles.length });
      return true;
    }

    // Condition 2: Hard filters changed
    try {
      const profile = await profileApi.me();
      const filtersChanged = hardFiltersChanged(profile.min_age, profile.max_age, profile.gender_preference);

      if (filtersChanged) {
        logger.debug("[discover] Should refetch: hard filters changed");
        return true;
      }
    } catch (err) {
      logger.error("[discover] Error checking hard filters", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return false;
  }, [currentIndex, profiles.length, hardFiltersChanged]);

  /**
   * Refetch on tab focus if conditions are met
   * Uses useFocusEffect to trigger when user returns to discover tab
   */
  useFocusEffect(
    useCallback(() => {
      const checkAndRefetch = async () => {
        const needsRefetch = await shouldRefetch();
        if (needsRefetch) {
          logger.debug("[discover] Tab focus refetch triggered");
          await fetchProfiles();
        }
      };

      checkAndRefetch();
    }, [shouldRefetch, fetchProfiles])
  );

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /**
   * Handle refresh with rotation animation
   * Rotates the icon while fetching and completes on success
   */
  const handleRefresh = useCallback(async () => {
    logger.debug("[discover] Refresh triggered");
    setRefreshing(true);

    // Stop any existing animation before starting new one
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Create and start new animation loop
    animationRef.current = Animated.loop(
      Animated.timing(refreshRotation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    );
    animationRef.current.start();

    await fetchProfiles();

    // Stop animation when done
    animationRef.current?.stop();
    refreshRotation.setValue(0);
  }, [fetchProfiles, refreshRotation]);

  const handleSwipeLeft = useCallback(() => {
    // Discard - just move to next
    const currentProfile = profiles[currentIndex];
    logger.debug("[discover] Swiped left", { discardedUserId: currentProfile?.user_id });
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
      logger.info("[discover] Like sent", { likedUserId: currentProfile.user_id });
      if (res.match) {
        logger.info("[discover] Match found", { matchedUserId: currentProfile.user_id, matchedName: currentProfile.name });
        Alert.alert("It's a Match!", `You matched with ${currentProfile.name}`);
      }
    }
  }, [profiles, currentIndex]);

  const handleViewProfile = useCallback((userId: string) => {
    logger.debug("[discover] Opening profile modal", { userId });
    setSelectedUserId(userId);
    setShowProfileModal(true);
  }, []);

  const handleProfileModalDismiss = useCallback(() => {
    logger.debug("[discover] Closing profile modal");
    setShowProfileModal(false);
  }, []);

  if (loading && !profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable disabled={true} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={MUTED} />
          </Pressable>
          <Pressable disabled={true} style={styles.headerButton}>
            <Ionicons name="flash" size={24} color={MUTED} />
          </Pressable>
        </View>
        <View style={styles.cardsContainer}>
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} style={styles.cardWrapper}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const rotateInterpolation = refreshRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (currentIndex >= profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleRefresh} disabled={refreshing} style={styles.headerButton}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
              <Ionicons name="refresh" size={24} color={PRIMARY} />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => {}} style={styles.headerButton}>
            <Ionicons name="flash" size={24} color={PRIMARY} />
          </Pressable>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>No more profiles</Text>
          <Text style={styles.subtitle}>Check back later for more people!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render current card and next card (for stack effect)
  // We reverse the array slice so the current card is on top (last in render order)
  const cardsToRender = profiles.slice(currentIndex, currentIndex + 2).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleRefresh} disabled={refreshing} style={styles.headerButton}>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
            <Ionicons name="refresh" size={24} color={PRIMARY} />
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => {}} style={styles.headerButton}>
          <Ionicons name="flash" size={24} color={PRIMARY} />
        </Pressable>
      </View>
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
                onViewProfile={isTopCard ? () => handleViewProfile(profile.user_id) : undefined}
              />
            </View>
          );
        })}
      </View>

      {/* Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        userId={selectedUserId}
        onDismiss={handleProfileModalDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  headerButton: {
    padding: 8,
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
