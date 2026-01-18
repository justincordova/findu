// React core
import { useCallback, useEffect, useMemo, useState } from "react";

// React Native
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

// Third-party
import { LinearGradient } from "expo-linear-gradient";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY, GRADIENT } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { handleSubmitProfile } from "./handleSubmitProfile";
import { Profile } from "@/types/Profile";
import { Lifestyle } from "@/types/Lifestyle";

// Types
type ProfileData = Partial<Profile> & {
  university_name?: string;
  campus_name?: string;
};

interface Step10Props {
  onNext: () => void;
  onValidityChange?: (isValid: boolean) => void;
  goToStep?: (step: string) => void;
}

/**
 * Step 10: Review - final profile review and submission
 * Displays all profile information for user confirmation before submitting
 */

/** Format birthdate into readable string */
function formatBirthdate(birthdate: string | Date | undefined) {
  if (!birthdate) return "Not set";
  const date = new Date(birthdate);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format labels to remove underscores and capitalize */
function formatLabel(field: string): string {
  return field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Render lifestyle field value with special handling for arrays */
function renderLifestyleValue(field: keyof Lifestyle, lifestyle?: Lifestyle | null): string {
  if (!lifestyle || !lifestyle[field]) return "Not set";
  const value = lifestyle[field];
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function Step10({
  onNext,
  onValidityChange,
  goToStep,
}: Step10Props) {
  const router = useRouter();
  const authState = useAuthStore.getState();
  const rawProfileData = useProfileSetupStore((state) => state.data);
  const profileData: ProfileData = useMemo(() => rawProfileData ?? {}, [rawProfileData]);

  const [submitting, setSubmitting] = useState(false);

  const fieldToStep: Record<string, string> = {
    name: "step2",
    birthdate: "step2",
    gender: "step2",
    pronouns: "step2",
    university_name: "step3",
    campus_name: "step3",
    major: "step3",
    university_year: "step3",
    grad_year: "step3",
    sexual_orientation: "step4",
    gender_preference: "step4",
    intent: "step4",
    min_age: "step5",
    max_age: "step5",
    bio: "step6",
    avatar_url: "step6",
    interests: "step7",
    lifestyle: "step8",
    photos: "step9",
  };


  const renderValue = useCallback(
    (field: keyof ProfileData) => {
      if (field === "birthdate") return formatBirthdate(profileData?.birthdate);
      if (field === "university_name") return profileData?.university_name || "Not set";
      if (field === "campus_name") return profileData?.campus_name || "Not set";
      const value = profileData?.[field];
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object" && value !== null) return "Not set";
      if (value === null || value === undefined || value === "") return "Not set";
      return String(value);
    },
    [profileData]
  );

  const isValid = useMemo(() => {
    const requiredFields = [
      "name",
      "birthdate",
      "gender",
      "pronouns",
      "university_name",
      "major",
      "university_year",
      "grad_year",
      "sexual_orientation",
      "gender_preference",
      "intent",
      "min_age",
      "max_age",
      "bio",
      "avatar_url",
      "interests",
      "photos",
    ];

    return requiredFields.every((field) => {
      const value = profileData?.[field as keyof ProfileData];
      if (field === "photos" || field === "interests") {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    });
  }, [profileData]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);


  /** Handle finishing the profile submission */
  const handleFinish = useCallback(async () => {
    setSubmitting(true);
    try {
      const { userId, token } = authState;

      if (!userId || !token) {
        console.error("User not authenticated");
        Alert.alert("Error", "User not authenticated. Please log in again.");
        setSubmitting(false);
        return;
      }

      await handleSubmitProfile(userId);
      // Navigate to main app after successful submission
      router.replace("/home/(tabs)/discover");
    } catch (err) {
      console.error("Error submitting profile:", err);
      Alert.alert(
        "Submission Failed",
        "Failed to submit your profile. Please try again."
      );
      setSubmitting(false);
    }
  }, [authState, router]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Review your profile</Text>
          <Text style={styles.subtitle}>Tap any section to edit</Text>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.sectionContent}>
            {["name", "birthdate", "gender", "pronouns"].map((field, idx) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.fieldRow,
                  idx !== 3 && styles.fieldRowBorder,
                ]}
                onPress={() => goToStep?.(fieldToStep[field])}
                activeOpacity={0.6}
              >
                <View style={styles.fieldLeft}>
                  <Text style={styles.fieldLabel}>{formatLabel(field)}</Text>
                </View>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {renderValue(field as keyof ProfileData)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Academic Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Academic Details</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.sectionContent}>
            {["university_name", "campus_name", "major", "university_year", "grad_year"].map(
              (field, idx) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.fieldRow,
                    idx !== 4 && styles.fieldRowBorder,
                  ]}
                  onPress={() => goToStep?.(fieldToStep[field])}
                  activeOpacity={0.6}
                >
                  <View style={styles.fieldLeft}>
                    <Text style={styles.fieldLabel}>{formatLabel(field)}</Text>
                  </View>
                  <Text style={styles.fieldValue} numberOfLines={2}>
                    {renderValue(field as keyof ProfileData)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.sectionContent}>
            {["sexual_orientation", "gender_preference", "intent", "min_age", "max_age"].map(
              (field, idx) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.fieldRow,
                    idx !== 4 && styles.fieldRowBorder,
                  ]}
                  onPress={() => goToStep?.(fieldToStep[field])}
                  activeOpacity={0.6}
                >
                  <View style={styles.fieldLeft}>
                    <Text style={styles.fieldLabel}>{formatLabel(field)}</Text>
                  </View>
                  <Text style={styles.fieldValue} numberOfLines={2}>
                    {renderValue(field as keyof ProfileData)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Lifestyle Section */}
        {profileData?.lifestyle && Object.keys(profileData.lifestyle).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.sectionContent}>
              {[
                { key: "drinking", label: "Drinking" },
                { key: "smoking", label: "Smoking" },
                { key: "cannabis", label: "Cannabis" },
                { key: "sleep_habits", label: "Sleep Habits" },
                { key: "pets", label: "Pets" },
                { key: "dietary_preferences", label: "Dietary Preferences" },
                { key: "study_style", label: "Study Style" },
                { key: "cleanliness", label: "Cleanliness" },
                { key: "caffeine", label: "Caffeine" },
                { key: "living_situation", label: "Living Situation" },
                { key: "fitness", label: "Fitness" },
              ]
                .filter(({ key }) => (profileData.lifestyle as any)?.[key] !== undefined)
                .map(({ key, label }, idx, filtered) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.fieldRow,
                      idx !== filtered.length - 1 && styles.fieldRowBorder,
                    ]}
                    onPress={() => goToStep?.("step8")}
                    activeOpacity={0.6}
                  >
                    <View style={styles.fieldLeft}>
                      <Text style={styles.fieldLabel}>{label}</Text>
                    </View>
                    <Text style={styles.fieldValue} numberOfLines={2}>
                      {renderLifestyleValue(key as keyof Lifestyle, profileData?.lifestyle)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Visual Content Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Story</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.sectionContent}>
            {/* Bio */}
            <TouchableOpacity
              style={styles.bioSection}
              onPress={() => goToStep?.("step6")}
              activeOpacity={0.7}
            >
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.bioValue}>
                {profileData?.bio || "No bio added"}
              </Text>
            </TouchableOpacity>

            {/* Avatar */}
            {profileData?.avatar_url && (
              <TouchableOpacity
                style={styles.avatarSection}
                onPress={() => goToStep?.("step6")}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarLabel}>Profile Picture</Text>
                <Image
                  source={{ uri: profileData.avatar_url }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            )}

            {/* Photos */}
            {profileData?.photos && profileData.photos.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.photosLabel}>Photos ({profileData.photos.length})</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosContainer}
                >
                  {profileData.photos.map((uri: string, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => goToStep?.("step9")}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri }} style={styles.photoItem} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Finish Button */}
      <View style={styles.buttonContainer}>
        {!submitting && !isValid ? (
          <TouchableOpacity
            onPress={handleFinish}
            disabled={true}
            style={[styles.button, styles.buttonDisabled]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <TouchableOpacity
              onPress={handleFinish}
              disabled={submitting}
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
    fontWeight: "500",
  },
  // Section styling
  section: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: DARK,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 3,
    backgroundColor: PRIMARY,
    borderRadius: 1.5,
    width: 32,
    marginTop: 4,
  },
  sectionContent: {
    paddingHorizontal: 0,
  },
  // Field row styling
  fieldRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  fieldLeft: {
    flex: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    textTransform: "capitalize",
    minWidth: 100,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: DARK,
    textAlign: "right",
  },
  // Bio section
  bioSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bioValue: {
    fontSize: 15,
    fontWeight: "500",
    color: DARK,
    lineHeight: 22,
  },
  // Avatar section
  avatarSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  // Photos section
  photosSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  photosContainer: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 20,
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  // Spacing
  bottomSpacer: {
    height: 0,
  },
  // Button container
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: MUTED,
  },
});
