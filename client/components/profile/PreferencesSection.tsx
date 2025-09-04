import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

export default function PreferencesSection() {
  const { data: profile } = useProfileSetupStore();

  const intent = profile?.intent || "";
  const genderPreference = Array.isArray(profile?.gender_preference)
    ? profile.gender_preference.filter(Boolean).map(String)
    : [];
  const minAge = profile?.min_age;
  const maxAge = profile?.max_age;
  const sexualOrientation = profile?.sexual_orientation || "";

  const getGenderPreferenceText = (): string => {
    if (genderPreference.length === 0) {
      return "Not set";
    }
    return genderPreference.join(", ");
  };

  const getAgeRangeText = (): string => {
    if (minAge == null && maxAge == null) {
      return "Not set";
    }

    const min = minAge != null ? String(minAge) : "?";
    const max = maxAge != null ? String(maxAge) : "?";

    if (min === "?" && max === "?") {
      return "Not set";
    }

    return `${min} - ${max}`;
  };

  const renderRow = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>

      {renderRow("Looking for:", intent || "Not set")}
      {renderRow("Gender preference:", getGenderPreferenceText())}
      {renderRow("Age range:", getAgeRangeText())}
      {renderRow("Sexual orientation:", sexualOrientation || "Not set")}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: MUTED,
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: DARK,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
});
