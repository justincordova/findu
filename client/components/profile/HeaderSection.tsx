import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/uploadService";
import logger from "@/config/logger";

const AVATAR_SIZE = 120;

/** Calculate age from birthdate */
function calculateAge(birthdate: string | undefined): number | null {
  if (!birthdate) return null;
  // ... (age calculation logic remains the same)
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
  const { data: profile, setProfileField } = useProfileSetupStore();
  const userId = useAuthStore.getState().userId;

  const handleUpdateAvatar = async () => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to update your avatar.");
      return;
    }

    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to your photos to update your avatar.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      // @ts-ignore
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    const newAvatarUri = pickerResult.assets[0].uri;

    try {
      // Optimistically update the UI
      setProfileField("avatar_url", newAvatarUri);

      // Upload with "update" mode
      const publicUrl = await uploadAvatar(userId, newAvatarUri, "update");

      // Final update with the public URL
      setProfileField("avatar_url", publicUrl);
      logger.info("Avatar updated successfully", { userId, publicUrl });
    } catch (error) {
      logger.error("Failed to update avatar", { error });
      Alert.alert("Upload Failed", "Could not update your avatar. Please try again.");
      // Revert optimistic update if needed
      setProfileField("avatar_url", profile?.avatar_url);
    }
  };

  const avatarUrl = profile?.avatar_url;
  const name = profile?.name || "";
  const gender = profile?.gender || "";
  const intent = profile?.intent || "";
  const age = calculateAge(profile?.birthdate);

  const displayName = name ? (age !== null ? `${name}, ${age}` : name) : age !== null ? `${age}` : "";

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleUpdateAvatar} activeOpacity={0.7}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>Set Avatar</Text>
          </View>
        )}
      </TouchableOpacity>

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
