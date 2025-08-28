import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { DARK, MUTED } from "@/constants/theme";

interface HeaderSectionProps {
  avatar_url?: string;
  name?: string;
  age?: number | null;
  gender?: string;
  intent?: string;
}

const AVATAR_SIZE = 120;
const { width } = Dimensions.get("window");

export default function HeaderSection({
  avatar_url,
  name = "",
  age,
  gender,
  intent,
}: HeaderSectionProps) {
  return (
    <View style={styles.container}>
      {avatar_url ? (
        <Image source={{ uri: avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>No Avatar</Text>
        </View>
      )}

      {name ? (
        <Text style={styles.name}>
          {name}
          {age != null ? `, ${age}` : ""}
        </Text>
      ) : null}

      {gender ? <Text style={styles.subText}>{gender}</Text> : null}
      {intent ? <Text style={styles.subText}>{intent}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: MUTED,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 4,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
  },
});
