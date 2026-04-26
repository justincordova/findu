// React core

// Navigation & Hooks
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
// React Native
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Project imports
import { profileApi } from "@/api/profile";
import AcademicSection from "@/components/profile/AcademicSection";
import BioSection from "@/components/profile/BioSection";
import InterestsSection from "@/components/profile/InterestsSection";
import LifestyleSection from "@/components/profile/LifestyleSection";
import PhotosSection from "@/components/profile/PhotosSection";
import PreferencesSection from "@/components/profile/PreferencesSection";
import UserInfoSection from "@/components/profile/UserInfoSection";
import SkeletonLoader, {
  SkeletonGroup,
} from "@/components/shared/SkeletonLoader";
import logger from "@/config/logger";
import { ProfileContext } from "@/contexts/ProfileContext";

/**
 * Profile Screen
 *
 * Main profile tab that displays user's complete profile.
 * Each section component is self-contained with its own editing logic.
 *
 * Features:
 * - Smart data fetching (refetch on tab focus, skip if unchanged)
 * - ProfileContext provider for sharing profile data across components
 * - Self-contained section components for clean architecture
 * - Comprehensive logging
 *
 * Architecture:
 * - profile.tsx: Data fetching and component rendering only
 * - ProfileContext: Shares profile data and refetch function
 * - Section components: Self-contained with editing logic and modals
 */
export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep reference to previous profile data to skip refetch if unchanged
  const profileDataRef = useRef<any>(null);

  /**
   * Fetch profile data from API
   * Only updates state if data has actually changed
   */
  const fetchProfile = useCallback(async () => {
    try {
      logger.debug("[profile] Fetching profile data");

      const data = await profileApi.me();

      // Only update state if data actually changed
      if (JSON.stringify(data) !== JSON.stringify(profileDataRef.current)) {
        logger.debug("[profile] Profile data changed, updating state", {
          previousLength: profileDataRef.current
            ? JSON.stringify(profileDataRef.current).length
            : 0,
          newLength: JSON.stringify(data).length,
        });
        setProfileData(data);
        profileDataRef.current = data;
      } else {
        logger.debug("[profile] Profile data unchanged, skipping state update");
      }

      setError(null);
    } catch (err) {
      logger.error("[profile] Error fetching profile", {
        error: err instanceof Error ? err.message : String(err),
      });
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch profile on tab focus
   * This ensures profile is always up-to-date when user returns to this tab
   */
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  // Loading state
  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          {/* Avatar and name skeleton */}
          <View style={styles.skeletonHeader}>
            <SkeletonLoader width={80} height={80} borderRadius={40} />
            <SkeletonLoader
              width="60%"
              height={24}
              borderRadius={4}
              style={{ marginTop: 16 }}
            />
            <SkeletonLoader
              width="40%"
              height={16}
              borderRadius={4}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Photos skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="40%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonLoader width="48%" height={180} borderRadius={8} />
              <SkeletonLoader width="48%" height={180} borderRadius={8} />
            </View>
          </View>

          {/* Bio skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="30%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <SkeletonGroup count={3} spacing={4} style={{ marginBottom: 8 }} />
          </View>

          {/* Interests skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="35%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonLoader
                  key={i}
                  width="28%"
                  height={32}
                  borderRadius={16}
                />
              ))}
            </View>
          </View>

          {/* Academic skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="30%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <SkeletonGroup count={3} spacing={8} />
          </View>

          {/* Preferences skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="35%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <SkeletonGroup count={4} spacing={8} />
          </View>

          {/* Lifestyle skeleton */}
          <View style={styles.skeletonSection}>
            <SkeletonLoader
              width="30%"
              height={18}
              borderRadius={4}
              style={{ marginBottom: 12 }}
            />
            <SkeletonGroup count={5} spacing={8} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProfileContext.Provider
      value={{ profile: profileData, refetch: fetchProfile }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* User Info Section - Avatar, Name, Age, Gender, Pronouns */}
          <UserInfoSection />

          {/* Photos Section - Grid layout positioned in natural flow */}
          <PhotosSection />

          {/* Bio Section - Bio text */}
          <BioSection />

          {/* Interests Section - Interest badges with add/remove */}
          <InterestsSection />

          {/* Academic Section - Major, Year, Graduation Year */}
          <AcademicSection />

          {/* Preferences Section - Sexual Orientation, Looking For, Age Range, Interested In */}
          <PreferencesSection />

          {/* Lifestyle Section - Drinking, Smoking, Cannabis, Sleep Habits, Pets, Dietary Preferences, etc. */}
          <LifestyleSection />
        </ScrollView>
      </SafeAreaView>
    </ProfileContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  skeletonHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  skeletonSection: {
    marginBottom: 24,
  },
});
