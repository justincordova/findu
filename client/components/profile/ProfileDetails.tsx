import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";

interface ProfileDetailsProps {
  school: string;
  major: string;
  gradYear: string;
  age: number;
}

export default function ProfileDetails({
  school,
  major,
  gradYear,
  age,
}: ProfileDetailsProps) {
  const details = [
    { label: "School", value: school },
    { label: "Major", value: major },
    { label: "Grad Year", value: gradYear },
    { label: "Age", value: age.toString() },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      {details.map((detail) => (
        <View key={detail.label} style={styles.row}>
          <Text style={styles.label}>{detail.label}</Text>
          <Text style={styles.value}>{detail.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: BACKGROUND,
    borderRadius: 16,
    shadowColor: DARK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: MUTED,
    fontWeight: "500",
  },
  value: {
    color: DARK,
  },
});
