import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker"; // For picking images from the gallery
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step5Props {
  data: ProfileSetupData; // Current profile data from parent
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Callback to update parent state
  onNext: () => void; // Callback to move to next step
}

export default function Step5({ data, onUpdate, onNext }: Step5Props) {
  const navigation = useNavigation(); // For back navigation

  /** Local state for bio and avatar */
  const [bio, setBio] = useState(data.bio || "");
  const [avatarUri, setAvatarUri] = useState(data.avatar_url || "");

  /** Handle bio text changes, limited to 500 characters */
  const handleBioChange = useCallback(
    (text: string) => {
      if (text.length <= 500) {
        setBio(text);
        onUpdate({ bio: text }); // Update parent state
      }
    },
    [onUpdate]
  );

  /** Pick image from library and update avatar */
  const pickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return; // Exit if permission denied

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images
      allowsEditing: true, // Allow cropping
      aspect: [1, 1], // Square aspect ratio
      quality: 0.8, // Compression
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri); // Update local state
      onUpdate({ avatar_url: uri }); // Update parent state
    }
  }, [onUpdate]);

  /** Temporary: always allow continue */
  const canContinue = useMemo(() => true, []);

  /** Back button handler */
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Details</Text>
        <Text style={styles.subtitle}>Add a bio and profile picture</Text>
      </View>

      {/* Form section */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
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
            value={bio}
            onChangeText={handleBioChange}
            multiline
            maxLength={500}
            placeholderTextColor={MUTED}
          />
          <Text style={styles.characterCount}>{bio.length}/500</Text>
        </View>
      </ScrollView>

      {/* Continue button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center" },
  form: { flex: 1, marginBottom: 32 },
  fieldContainer: { marginBottom: 24, alignItems: "center" },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
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
  characterCount: { textAlign: "right", marginTop: 4, color: MUTED, fontSize: 12 },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
