import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED } from "@/constants/theme";

interface PreferencesSectionProps {
  intent: string;
  gender_preference: string[];
  min_age: number;
  max_age: number;
  sexual_orientation: string;
}

export default function PreferencesSection({
  intent,
  gender_preference,
  min_age,
  max_age,
  sexual_orientation,
}: PreferencesSectionProps) {
  const formatGenderPreference = () => {
    if (!gender_preference || gender_preference.length === 0) return "Not set";
    return gender_preference.join(", ");
  };

  const formatAgeRange = () => {
    if (!min_age && !max_age) return "Not set";
    return `${min_age || "?"} - ${max_age || "?"}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Looking for:</Text>
        <Text style={styles.value}>{intent || "Not set"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Gender preference:</Text>
        <Text style={styles.value}>{formatGenderPreference()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Age range:</Text>
        <Text style={styles.value}>{formatAgeRange()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Sexual orientation:</Text>
        <Text style={styles.value}>{sexual_orientation || "Not set"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
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
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    color: MUTED,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: DARK,
    fontWeight: "600",
    textAlign: "right",
  },
});
