// React Native
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Project imports
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/uploadService";
import logger from "@/config/logger";

// Constants
const AVATAR_SIZE = 120;
const AVATAR_BORDER_RADIUS = AVATAR_SIZE / 2;
const AVATAR_MARGIN_BOTTOM = 16;
const CONTAINER_MARGIN_TOP = 24;
const CONTAINER_MARGIN_BOTTOM = 24;
const CONTAINER_PADDING_HORIZONTAL = 16;
const AVATAR_PLACEHOLDER_BG = "#e5e7eb";
const NAME_FONT_SIZE = 24;
const NAME_FONT_WEIGHT = "bold";
const NAME_MARGIN_BOTTOM = 4;
const SUBTEXT_FONT_SIZE = 16;
const SUBTEXT_MARGIN_BOTTOM = 2;
const PLACEHOLDER_TEXT_FONT_SIZE = 14;

/**
 * Profile header with avatar, name, age, gender, and intent
 * Allows avatar upload with image picker
 */

/** Calculate age from birthdate accounting for month/day not yet passed */
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
    marginTop: CONTAINER_MARGIN_TOP,
    marginBottom: CONTAINER_MARGIN_BOTTOM,
    paddingHorizontal: CONTAINER_PADDING_HORIZONTAL,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    marginBottom: AVATAR_MARGIN_BOTTOM,
  },
  avatarPlaceholder: {
    backgroundColor: AVATAR_PLACEHOLDER_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: MUTED,
    fontSize: PLACEHOLDER_TEXT_FONT_SIZE,
    textAlign: "center",
  },
  name: {
    fontSize: NAME_FONT_SIZE,
    fontWeight: NAME_FONT_WEIGHT,
    color: DARK,
    marginBottom: NAME_MARGIN_BOTTOM,
    textAlign: "center",
  },
  subText: {
    fontSize: SUBTEXT_FONT_SIZE,
    color: MUTED,
    textAlign: "center",
    marginBottom: SUBTEXT_MARGIN_BOTTOM,
  },
});
