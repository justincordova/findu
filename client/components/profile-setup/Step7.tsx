import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Step7Props {
  data: ProfileSetupData; // All profile data to review
  onNext: () => void; // Finish setup callback
}

export default function Step7({ data, onNext }: Step7Props) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>(); // For navigation

  /** Map profile fields to the step where they can be edited */
  const fieldToStep: { [key: string]: string } = {
    name: "step1",
    age: "step1",
    gender: "step1",
    pronouns: "step2",
    intent: "step2",
    min_age: "step2",
    max_age: "step2",
    sexualOrientation: "step2",
    genderPreference: "step2",
    bio: "step5",
    avatar_url: "step5",
    photos: "step6",
  };

  /** Navigate back to the appropriate step when editing a field */
  const goBackToStep = useCallback(
    (step: string) => {
      navigation.goBack(); // Can be replaced with actual step navigation if needed
    },
    [navigation]
  );

  /** Convert field value to displayable text */
  const renderValue = (field: keyof ProfileSetupData) => {
    const value = data[field];
    if (Array.isArray(value)) return value.join(", "); // For arrays like photos
    if (!value) return "Not set";
    return String(value);
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Review your profile</Text>
        <Text style={styles.subtitle}>Tap any item to edit</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        {["name", "age", "gender", "pronouns"].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goBackToStep(fieldToStep[field])} // Edit on tap
          >
            <Text style={styles.infoLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}:</Text>
            <Text style={styles.infoValue}>{renderValue(field as keyof ProfileSetupData)}</Text>
          </TouchableOpacity>
        ))}

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        {["intent", "min_age", "max_age", "sexualOrientation", "genderPreference"].map(
          (field) => (
            <TouchableOpacity
              key={field}
              style={styles.infoRow}
              onPress={() => goBackToStep(fieldToStep[field])} // Edit on tap
            >
              <Text style={styles.infoLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}:</Text>
              <Text style={styles.infoValue}>{renderValue(field as keyof ProfileSetupData)}</Text>
            </TouchableOpacity>
          )
        )}

        {/* Bio */}
        <Text style={styles.sectionTitle}>Bio</Text>
        <TouchableOpacity style={styles.infoRow} onPress={() => goBackToStep("step5")}>
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoValue}>{data.bio || "Not set"}</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <TouchableOpacity style={styles.infoRow} onPress={() => goBackToStep("step5")}>
          {data.avatar_url ? (
            <Image source={{ uri: data.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={{ color: MUTED }}>No avatar selected</Text>
          )}
        </TouchableOpacity>

        {/* Photos */}
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosContainer}
        >
          {data.photos && data.photos.length > 0 ? (
            data.photos.map((uri, idx) => (
              <TouchableOpacity key={idx} onPress={() => goBackToStep("step6")}>
                <Image source={{ uri }} style={styles.photo} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: MUTED }}>No photos added</Text>
          )}
        </ScrollView>
      </ScrollView>

      {/* Finish button */}
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center", marginBottom: 16 },
  form: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: DARK, marginBottom: 12 },
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
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
});