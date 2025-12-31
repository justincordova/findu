import { useCallback, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { profileApi } from "@/api/profile";
import { ProfileContext } from "@/contexts/ProfileContext";
import UserInfoSection from "@/components/profile/UserInfoSection";
import PhotosSection from "@/components/profile/PhotosSection";
import BioSection from "@/components/profile/BioSection";
import InterestsSection from "@/components/profile/InterestsSection";
import AcademicSection from "@/components/profile/AcademicSection";
import PreferencesSection from "@/components/profile/PreferencesSection";
import LifestyleSection from "@/components/profile/LifestyleSection";
import logger from "@/config/logger";

interface ProfileViewProps {
  userId: string;
  isEditable?: boolean;
  shouldFetch?: boolean;
}

export default function ProfileView({
  userId,
  isEditable = false,
  shouldFetch = true,
}: ProfileViewProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profileDataRef = useRef<any>(null);
  const hasLoadedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (hasLoadedRef.current) {
      return;
    }

    try {
      logger.debug("[ProfileView] Fetching profile for user", { userId });

      const data = await profileApi.get(userId);

      if (JSON.stringify(data) !== JSON.stringify(profileDataRef.current)) {
        logger.debug("[ProfileView] Profile data loaded", { userId });
        setProfileData(data);
        profileDataRef.current = data;
      }

      setError(null);
    } catch (err) {
      logger.error("[ProfileView] Error fetching profile", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [userId]);

  // Fetch profile only when shouldFetch is true (modal visible)
  useEffect(() => {
    if (shouldFetch && !hasLoadedRef.current) {
      fetchProfile();
    }
  }, [shouldFetch, fetchProfile]);

  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProfileContext.Provider
      value={{
        profile: profileData,
        refetch: async () => {
          hasLoadedRef.current = false;
          await fetchProfile();
        },
        isEditable,
      }}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <UserInfoSection />
        <PhotosSection />
        <BioSection />
        <InterestsSection />
        <AcademicSection />
        <PreferencesSection />
        <LifestyleSection />
      </ScrollView>
    </ProfileContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
});
