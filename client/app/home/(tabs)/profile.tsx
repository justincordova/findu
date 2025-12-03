import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { profileApi } from "@/api/profile";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";
import { PRIMARY } from "@/constants/theme";
import { EditModeProvider, useEditMode } from "@/contexts/EditModeContext";

import HeaderSection from "@/components/profile/HeaderSection";
import AboutSection from "@/components/profile/AboutSection";
import AcademicSection from "@/components/profile/AcademicSection";
import PhotosSection from "@/components/profile/PhotosSection";
import PreferencesSection from "@/components/profile/PreferencesSection";

function ProfileContent() {
  const { data: profile, setField } = useProfileSetupStore();
  const { isEditMode, setEditMode } = useEditMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shakeAnim = new Animated.Value(0);

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

  useEffect(() => {
    if (isEditMode) {
      // Start shake animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shakeAnim.setValue(0);
    }
  }, [isEditMode]);

  const handleEditToggle = () => {
    setEditMode(!isEditMode);
  };

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
      
      {/* Edit/Done Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={[styles.editButton, isEditMode && styles.editButtonActive]} 
          onPress={handleEditToggle}
        >
          <Text style={[styles.editButtonText, isEditMode && styles.editButtonTextActive]}>
            {isEditMode ? "Done" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

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

export default function ProfileScreen() {
  return (
    <EditModeProvider>
      <ProfileContent />
    </EditModeProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  editButtonActive: {
    backgroundColor: PRIMARY,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  editButtonTextActive: {
    color: "white",
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
