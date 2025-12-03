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

  const isValid = useMemo(() => true, []);

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

      {/* 3x2 Grid */}
      <ScrollView
        style={styles.form}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridContainer}>
          {(profileData?.photos || []).map((uri, idx) => (
            <View key={idx} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(idx)}
              >
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          {(profileData?.photos?.length || 0) < 6 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
              <Ionicons name="add" size={40} color={PRIMARY} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
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
    textAlign: "center",
    marginBottom: 16,
  },
  form: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  photoWrapper: {
    position: "relative",
    width: "48%",
    aspectRatio: 3 / 4,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addPhotoButton: {
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: 14,
    color: PRIMARY,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
  },
});
