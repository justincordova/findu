import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

export default function Step6({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);

  /** Pick multiple photos up to 6 */
  const pickImages = useCallback(async () => {
    const remaining = 6 - (profileData?.photos?.length || 0);
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: remaining,
    });

    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((asset) => asset.uri);
      setField("photos", [...(profileData?.photos || []), ...uris].slice(0, 6));
    }
  }, [profileData?.photos, setField]);

  /** Remove a photo by index */
  const removePhoto = useCallback(
    (index: number) => {
      const updatedPhotos = [...(profileData?.photos || [])];
      updatedPhotos.splice(index, 1);
      setField("photos", updatedPhotos);
    },
    [profileData?.photos, setField]
  );

  /** Step validity: at least 6 photos required */
  const isValid = useMemo(
    () => (profileData?.photos?.length || 0) >= 6,
    [profileData?.photos]
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
      <Text style={styles.title}>Add your photos</Text>
      <Text style={styles.subtitle}>Add up to 6 photos for your profile</Text>

      {/* Horizontal scrollable photos */}
      <ScrollView
        style={styles.form}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosContainer}
      >
        {(profileData?.photos || []).map((uri, idx) => (
          <View key={idx} style={styles.photoWrapper}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePhoto(idx)}
            >
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {(profileData?.photos?.length || 0) < 6 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
            <Ionicons name="add" size={36} color={PRIMARY} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
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
    textAlign: "center",
    marginBottom: 16,
  },
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
  addPhotoText: {
    fontSize: 12,
    color: PRIMARY,
    marginTop: 4,
    textAlign: "center",
  },
});
