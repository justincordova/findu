import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/Profile";
import HeaderSection from "@/components/profile/HeaderSection";
import AboutSection from "@/components/profile/AboutSection";
import AcademicSection from "@/components/profile/AcademicSection";
import PhotosSection from "@/components/profile/PhotosSection";
import PreferencesSection from "@/components/profile/PrefrencesSection";
import logger from "@/config/logger";

/** Calculate age from birthdate */
function calculateAge(birthdate: string | undefined) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const diffMs = Date.now() - birth.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .single();

        if (error) {
          logger.error("Error fetching profile:", error);
          return;
        }

        setProfile({
          ...data,
          avatar_url: data.avatar_url || "",
          photos: data.photos || [],
          interests: data.interests || [],
          gender_preference: data.gender_preference || [],
        });
      } catch (err) {
        logger.error("Unexpected error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        {/* No profile found */}
      </SafeAreaView>
    );
  }

  const age = calculateAge(profile.birthdate);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeaderSection
          avatar_url={profile.avatar_url}
          name={profile.name}
          age={age}
          gender={profile.gender}
          intent={profile.intent}
        />

        <AboutSection bio={profile.bio} interests={profile.interests} />

        <AcademicSection
          university={profile.university}
          major={profile.major}
          grad_year={profile.grad_year}
          university_year={profile.university_year}
        />

        <PhotosSection photos={profile.photos} />

        <PreferencesSection
          intent={profile.intent}
          gender_preference={profile.gender_preference}
          min_age={profile.min_age}
          max_age={profile.max_age}
          sexual_orientation={profile.sexual_orientation}
        />

        <View style={{ height: 100 }} /> {/* Bottom padding for tabs */}
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
  },
});
