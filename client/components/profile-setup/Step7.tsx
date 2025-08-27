import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileSetupStore";
import { handleSubmitProfile } from "./handleSubmitProfile";

type ProfileData = {
  name?: string;
  birthdate?: string;
  gender?: string;
  pronouns?: string;
  intent?: string;
  min_age?: number;
  max_age?: number;
  sexual_orientation?: string;
  gender_preference?: string[];
  bio?: string;
  avatar_url?: string;
  photos?: string[];
};

/**
 * Format birthdate into readable string
 */
function formatBirthdate(birthdate: string | Date | undefined) {
  if (!birthdate) return "Not set";
  const date = new Date(birthdate);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Step7({
  onBack,
  onNext,
  onValidityChange,
}: {
  onBack?: () => void;
  onNext: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData: ProfileData = useProfileSetupStore((state) => state.data);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const fieldToStep: Record<string, string> = {
    name: "step1",
    birthdate: "step1",
    gender: "step1",
    pronouns: "step2",
    intent: "step2",
    min_age: "step4",
    max_age: "step4",
    sexual_orientation: "step3",
    gender_preference: "step3",
    bio: "step5",
    avatar_url: "step5",
    photos: "step6",
  };

  const goBackToStep = useCallback(
    (step: string) => {
      onBack?.();
    },
    [onBack]
  );

  const renderValue = useCallback(
    (field: keyof ProfileData) => {
      if (field === "birthdate") return formatBirthdate(profileData?.birthdate);

      const value = profileData?.[field];
      if (Array.isArray(value)) return (value as string[]).join(", ");
      if (value === null || value === undefined || value === "") return "Not set";
      return String(value);
    },
    [profileData]
  );

  const isValid = useMemo(() => true, []);
  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const handleFinish = useCallback(async () => {
    setSubmitting(true);
    try {
      await handleSubmitProfile();

      // Navigate to home tab after submission
      router.replace("/home/(tabs)/discover");
    } catch (err) {
      console.error("Error submitting profile:", err);
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Review your profile</Text>
        <Text style={styles.subtitle}>Tap any item to edit</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        {["name", "birthdate", "gender", "pronouns"].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goBackToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </Text>
            <Text style={styles.infoValue}>
              {renderValue(field as keyof ProfileData)}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Preferences</Text>
        {[
          "intent",
          "min_age",
          "max_age",
          "sexual_orientation",
          "gender_preference",
        ].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goBackToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </Text>
            <Text style={styles.infoValue}>
              {renderValue(field as keyof ProfileData)}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Bio</Text>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => goBackToStep("step5")}
        >
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoValue}>{profileData?.bio || "Not set"}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => goBackToStep("step5")}
        >
          {profileData?.avatar_url ? (
            <Image
              source={{ uri: profileData?.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Text style={{ color: MUTED }}>No avatar selected</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosContainer}
        >
          {profileData?.photos && profileData.photos.length > 0 ? (
            (profileData.photos as string[]).map((uri: string, idx: number) => (
              <TouchableOpacity key={idx} onPress={() => goBackToStep("step6")}>
                <Image source={{ uri }} style={styles.photo} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: MUTED }}>No photos added</Text>
          )}
        </ScrollView>
      </ScrollView>

      <TouchableOpacity
        onPress={handleFinish}
        disabled={submitting || !isValid}
        style={[
          styles.button,
          (!isValid || submitting) && styles.buttonDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            style={[
              styles.buttonText,
              (!isValid || submitting) && styles.buttonTextDisabled,
            ]}
          >
            Finish
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: BACKGROUND,
  },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
    marginBottom: 16,
  },
  form: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: DARK,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: { fontSize: 14, color: MUTED, fontWeight: "500" },
  infoValue: { fontSize: 14, color: DARK, fontWeight: "500" },
  avatar: { width: 100, height: 100, borderRadius: 12 },
  photosContainer: { flexDirection: "row", gap: 12 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextDisabled: { color: MUTED },
});
