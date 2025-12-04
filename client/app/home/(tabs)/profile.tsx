import React, { useState, useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { profileApi } from "@/api/profile";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";
import { DARK, MUTED, PRIMARY } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.3;

const YEAR_MAP: Record<number, string> = {
  1: "Freshman",
  2: "Sophomore",
  3: "Junior",
  4: "Senior",
  5: "Grad",
};

export default function ProfileScreen() {
  const { data: profileData, setProfileData } = useProfileSetupStore();
  const [loading, setLoading] = useState(!profileData); // Only load if no data
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const photos = Array.isArray(profileData?.photos) ? profileData.photos : [];
  // Always show avatar first, then other photos
  const allPhotos = [profileData?.avatar_url, ...photos].filter(Boolean);
  const displayPhotos = allPhotos.length > 0 ? allPhotos : [];
  
  const calculateAge = (birthdate: string | undefined): number | null => {
    if (!birthdate) return null;
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(profileData?.birthdate);
  const interests = Array.isArray(profileData?.interests)
    ? profileData.interests.filter(Boolean).map(String)
    : [];

  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Photo Carousel */}
        <View style={styles.photoCarouselContainer}>
          {displayPhotos.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
              >
                {displayPhotos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Gradient Overlay */}
              <View style={styles.gradientOverlay} />
              
              {/* Name & Age Card */}
              <View style={styles.nameCard}>
                <Text style={styles.nameText}>
                  {profileData?.name}
                  {age !== null && (
                    <Text style={styles.ageText}> {age}</Text>
                  )}
                </Text>
                {profileData?.university_name && (
                  <View style={styles.universityRow}>
                    <Ionicons name="school" size={16} color="white" />
                    <Text style={styles.universityText}>
                      {profileData.university_name}
                    </Text>
                  </View>
                )}
                
                {/* Photo Indicators */}
                {displayPhotos.length > 1 && (
                  <View style={styles.indicatorContainer}>
                    {displayPhotos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentPhotoIndex && styles.indicatorActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noPhotoContainer}>
              <Ionicons name="person-circle-outline" size={120} color="#D1D5DB" />
              <Text style={styles.noPhotoText}>No photos</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Bio Card */}
          {profileData?.bio && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="reader-outline" size={24} color={PRIMARY} />
                <Text style={styles.cardTitle}>About Me</Text>
              </View>
              <Text style={styles.bioText}>{profileData.bio}</Text>
            </View>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="heart-outline" size={24} color={PRIMARY} />
                <Text style={styles.cardTitle}>Interests</Text>
              </View>
              <View style={styles.interestsContainer}>
                {interests.map((interest, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Academic Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Academic Info</Text>
            </View>
            <View style={styles.infoGrid}>
              {profileData?.major && (
                <View style={styles.infoItem}>
                  <Ionicons name="book-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Major</Text>
                    <Text style={styles.infoValue}>{profileData.major}</Text>
                  </View>
                </View>
              )}
              {profileData?.university_year && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Year</Text>
                    <Text style={styles.infoValue}>
                      {YEAR_MAP[profileData.university_year] || "N/A"}
                    </Text>
                  </View>
                </View>
              )}
              {profileData?.grad_year && (
                <View style={styles.infoItem}>
                  <Ionicons name="flag-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Graduating</Text>
                    <Text style={styles.infoValue}>{profileData.grad_year}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Basic Info</Text>
            </View>
            <View style={styles.infoGrid}>
              {profileData?.gender && (
                <View style={styles.infoItem}>
                  <Ionicons name="male-female-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>{profileData.gender}</Text>
                  </View>
                </View>
              )}
              {profileData?.pronouns && (
                <View style={styles.infoItem}>
                  <Ionicons name="chatbox-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Pronouns</Text>
                    <Text style={styles.infoValue}>{profileData.pronouns}</Text>
                  </View>
                </View>
              )}
              {profileData?.intent && (
                <View style={styles.infoItem}>
                  <Ionicons name="compass-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Looking For</Text>
                    <Text style={styles.infoValue}>{profileData.intent}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flex: 1,
  },
  photoCarouselContainer: {
    height: PHOTO_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  noPhotoContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  noPhotoText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    flex: 1,
    maxWidth: 40,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "transparent",
    background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))",
  },
  nameCard: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  nameText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ageText: {
    fontSize: 28,
    fontWeight: "400",
  },
  universityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  universityText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  contentSection: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: DARK,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: DARK,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
