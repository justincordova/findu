import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { DARK, MUTED, PRIMARY } from "@/constants/theme";

interface AboutSectionProps {
  bio?: string;
  interests?: string[];
}

export default function AboutSection({
  bio = "",
  interests = [],
}: AboutSectionProps) {
  const safeInterests = Array.isArray(interests)
    ? interests.map((i) => String(i))
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>

      <Text style={styles.subtitle}>Bio</Text>
      <Text style={styles.content}>{bio || "No bio provided."}</Text>

      <Text style={styles.subtitle}>Interests</Text>
      {safeInterests.length > 0 ? (
        <FlatList
          data={safeInterests}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.interestsContainer}
          renderItem={({ item }) => (
            <View style={styles.interestBadge}>
              <Text style={styles.interestText}>{item}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.content}>No interests added.</Text>
      )}
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
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    color: DARK,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
});
