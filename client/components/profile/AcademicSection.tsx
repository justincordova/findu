import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

const YEAR_MAP: Record<number, string> = {
  1: "Freshman",
  2: "Sophomore",
  3: "Junior",
  4: "Senior",
  5: "Grad",
};

export default function AcademicSection() {
  const { data: profile } = useProfileSetupStore();

  const university = profile?.university_name || "";
  const universityYear = profile?.university_year;
  const major = profile?.major || "";
  const gradYear = profile?.grad_year;

  const getYearText = (): string => {
    if (universityYear == null) return "Not set";
    const yearText = YEAR_MAP[universityYear];
    return yearText || "Unknown";
  };

  const getGradYearText = (): string => {
    if (gradYear == null) return "Not set";
    return String(gradYear);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic Info</Text>

      <View style={styles.row}>
        <Text style={styles.label}>University:</Text>
        <Text style={styles.value}>{university || "Not set"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Year:</Text>
        <Text style={styles.value}>{getYearText()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Major:</Text>
        <Text style={styles.value}>{major || "Not set"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Graduation Year:</Text>
        <Text style={styles.value}>{getGradYearText()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    flex: 1,
    textAlign: "right",
  },
});
