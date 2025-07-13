import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.inner}>
      <Text style={styles.title}>FindU</Text>
      <Text style={styles.subtitle}>
        Dating App for Verified College Students Only
      </Text>
      <Text style={styles.description}>
        Discover real connections on your campus.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#555",
  },
});
