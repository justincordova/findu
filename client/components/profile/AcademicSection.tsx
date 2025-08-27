import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED } from "@/constants/theme";

interface AcademicSectionProps {
  university: string;
  university_year: number; // 1-5
  major: string;
  grad_year: number;
}

const yearMap: Record<number, string> = {
  1: "Freshman",
  2: "Sophomore",
  3: "Junior",
  4: "Senior",
  5: "Grad",
};

export default function AcademicSection({
  university,
  university_year,
  major,
  grad_year,
}: AcademicSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic Info</Text>

      <Text style={styles.label}>University:</Text>
      <Text style={styles.value}>{university}</Text>

      <Text style={styles.label}>Year:</Text>
      <Text style={styles.value}>{yearMap[university_year] || "N/A"}</Text>

      <Text style={styles.label}>Major:</Text>
      <Text style={styles.value}>{major}</Text>

      <Text style={styles.label}>Graduation Year:</Text>
      <Text style={styles.value}>{grad_year}</Text>
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
  },
});
