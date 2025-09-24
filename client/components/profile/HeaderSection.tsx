import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

const AVATAR_SIZE = 120;
const { width } = Dimensions.get("window");

/** Calculate age from birthdate */
function calculateAge(birthdate: string | undefined): number | null {
  if (!birthdate) return null;

  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  } catch {
    return null;
  }
}

export default function HeaderSection() {
  const { data: profile } = useProfileSetupStore();

  const avatarUrl = profile?.avatar_url;
  const name = profile?.name || "";
  const gender = profile?.gender || "";
  const intent = profile?.intent || "";
  const age = calculateAge(profile?.birthdate);

  const displayName = name ? (age !== null ? `${name}, ${age}` : name) : age !== null ? `${age}` : "";

  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>No Avatar</Text>
        </View>
      )}

      {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
      {gender ? <Text style={styles.subText}>{gender}</Text> : null}
      {intent ? <Text style={styles.subText}>{intent}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
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
    fontSize: 14,
    textAlign: "center",
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
    marginBottom: 2,
  },
});
