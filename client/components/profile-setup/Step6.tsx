import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_SIZE = (SCREEN_WIDTH - 64) / 2.5; // Bigger photos, 2.5 per row conceptually

export default function Step6({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  /** Pick multiple photos up to 6 */
  const pickImages = useCallback(async () => {
    const remaining = 6 - (profileData?.photos?.length || 0);
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      // @ts-ignore
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: remaining,
    });

    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((asset) => asset.uri);
      setProfileField("photos", [...(profileData?.photos || []), ...uris].slice(0, 6));
    }
  }, [profileData?.photos, setProfileField]);

  /** Remove a photo by index */
  const removePhoto = useCallback(
    (index: number) => {
      const updatedPhotos = [...(profileData?.photos || [])];
      updatedPhotos.splice(index, 1);
      setProfileField("photos", updatedPhotos);
    },
    [profileData?.photos, setProfileField]
  );

  /** Step validity: at least 6 photos required */
  const isValid = useMemo(
    () => (profileData?.photos?.length || 0) >= 2,
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

      {/* 3x2 Grid of photos */}
      <View style={styles.gridContainer}>
        {Array.from({ length: 6 }).map((_, idx) => {
          const photo = (profileData?.photos || [])[idx];
          
          if (photo) {
            // Show photo with remove button
            return (
              <View key={idx} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(idx)}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            );
          } else if (idx === (profileData?.photos?.length || 0)) {
            // Show add button for next empty slot
            return (
              <TouchableOpacity
                key={idx}
                style={styles.addPhotoButton}
                onPress={pickImages}
              >
                <Ionicons name="add" size={36} color={PRIMARY} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            );
          } else {
            // Show empty placeholder
            return (
              <View key={idx} style={styles.emptySlot} />
            );
          }
        })}
      </View>
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
  backButton: {
    position: "absolute",
    top: 48,
    left: 24,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 80,
  },
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
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  photoWrapper: {
    position: "relative",
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  addPhotoText: {
    fontSize: 12,
    color: PRIMARY,
    marginTop: 4,
    textAlign: "center",
  },
  emptySlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
});
