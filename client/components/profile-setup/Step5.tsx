import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileSetupStore";

export default function Step5({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);

  /** Pick image from library */
  const pickImage = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setField("avatar_url", uri);
    }
  }, [setField]);

/** Step validity: require both profile picture and bio */
const isValid = useMemo(
  () => !!profileData.avatar_url && !!profileData.bio?.trim(),
  [profileData.avatar_url, profileData.bio]
);


  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <View style={styles.container}>
      {/* Header */}
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Profile Details</Text>
      <Text style={styles.subtitle}>Add a bio and profile picture</Text>

      {/* Form */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {profileData.avatar_url ? (
              <Image
                source={{ uri: profileData.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={36} color={MUTED} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="Tell us about yourself..."
            value={profileData.bio ?? ""}
            onChangeText={(text) => setField("bio", text)}
            multiline
            maxLength={500}
            placeholderTextColor={MUTED}
          />
          <Text style={styles.characterCount}>
            {(profileData.bio ?? "").length}/500
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: BACKGROUND,
  },
  backButton: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 32,
    textAlign: "center",
  },
  form: { flex: 1 },
  fieldContainer: { marginBottom: 24, alignItems: "center" },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  bioInput: {
    width: "100%",
    minHeight: 120,
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    textAlignVertical: "top",
  },
  characterCount: {
    textAlign: "right",
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
  },
});
