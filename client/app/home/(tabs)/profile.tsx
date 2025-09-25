import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { profileApi } from "@/api/profile";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";

import HeaderSection from "@/components/profile/HeaderSection";
import AboutSection from "@/components/profile/AboutSection";
import AcademicSection from "@/components/profile/AcademicSection";
import PhotosSection from "@/components/profile/PhotosSection";
import PreferencesSection from "@/components/profile/PreferencesSection";

export default function ProfileScreen() {
  const { data: profile, setField } = useProfileSetupStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (profile && Object.keys(profile).length > 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await profileApi.me();

        // Merge API data into store
        Object.entries(data).forEach(([key, value]) => {
          const typedKey = key as keyof typeof data;
          setField(typedKey as any, value);
        });
      } catch (err) {
        logger.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profile, setField]);

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
