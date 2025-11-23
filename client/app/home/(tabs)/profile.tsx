import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { profileApi } from "@/api/profile";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";

import HeaderSection from "@/components/profile/HeaderSection";
import AboutSection from "@/components/profile/AboutSection";
import AcademicSection from "@/components/profile/AcademicSection";
import PhotosSection from "@/components/profile/PhotosSection";
import PreferencesSection from "@/components/profile/PreferencesSection";

export default function ProfileScreen() {
  const { data: profileData, setProfileData } = useProfileSetupStore();
  const [loading, setLoading] = useState(!profileData); // Only load if no data
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!loading) setLoading(true); // Ensure loading is true when fetching
    setError(null);

    try {
      const data = await profileApi.me();
      setProfileData(data); // Update store with all data at once
    } catch (err) {
      logger.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [loading, setProfileData]);

  // Fetch profile on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!profileData) {
        // If there's no data in the store, fetch it.
        fetchProfile();
      } else {
        // Data already exists, no need to refetch on every focus.
        // TODO: Implement a lightweight API call here to check if the profile
        // on the server has been updated since the last fetch.
        // Compare `profileData.updated_at` with the server's timestamp.
        // If it's stale, then call `fetchProfile()`.
        logger.info("Profile data already in store. Skipping fetch.");
      }
    }, [profileData, fetchProfile])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeaderSection />
        <AboutSection />
        <AcademicSection />
        <PhotosSection />
        <PreferencesSection />
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContent: {
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
  bottomPadding: {
    height: 100,
  },
});
