import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker"; // For picking images from gallery
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step6Props {
  data: ProfileSetupData; // Current profile data
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Update parent state
  onNext: () => void; // Move to next step
}

export default function Step6({ data, onUpdate, onNext }: Step6Props) {
  const navigation = useNavigation(); // For back navigation

  /** Pick multiple photos up to 6 */
  const pickImages = useCallback(async () => {
    const remaining = 6 - (data.photos?.length || 0); // Max 6 photos
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Only images
      allowsMultipleSelection: true, // Allow picking multiple
      quality: 0.7, // Compression
      selectionLimit: remaining, // Limit to remaining slots
    });

    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((asset) => asset.uri);
      onUpdate({ photos: [...(data.photos || []), ...uris].slice(0, 6) }); // Append new photos
    }
  }, [data.photos, onUpdate]);

  /** Remove a photo by index */
  const removePhoto = useCallback(
    (index: number) => {
      const updatedPhotos = [...(data.photos || [])];
      updatedPhotos.splice(index, 1);
      onUpdate({ photos: updatedPhotos });
    },
    [data.photos, onUpdate]
  );

  /** Temporary: allow continue even if no photos added */
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
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add up to 6 photos for your profile</Text>
      </View>

      {/* Horizontal scrollable photos */}
      <ScrollView
        style={styles.form}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosContainer}
      >
        {/* Render existing photos */}
        {(data.photos || []).map((uri, idx) => (
          <View key={idx} style={styles.photoWrapper}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(idx)}>
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add photo button if less than 6 photos */}
        {(data.photos?.length || 0) < 6 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
            <Ionicons name="add" size={36} color={PRIMARY} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
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
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center", marginBottom: 16 },
  form: { flex: 1 },
  photosContainer: { alignItems: "center", gap: 16 },
  photoWrapper: { position: "relative", marginRight: 16 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  removeButton: { position: "absolute", top: -8, right: -8 },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: { fontSize: 12, color: PRIMARY, marginTop: 4, textAlign: "center" },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
