// React core
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// React Native
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { updatePhoto } from "@/services/uploadService";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";
import { profileStyles } from "./shared/profileStyles";
import { MUTED, DARK, PRIMARY } from "@/constants/theme";

// Constants
const { width } = Dimensions.get("window");
const SECTION_PADDING = 16; // Container padding (paddingHorizontal)
const CARD_PADDING = 20; // Card internal padding
const GAP = 12;
const COLS = 2;
// Available width: full width - section padding - card padding - gap between photos
const AVAILABLE_WIDTH = width - SECTION_PADDING * 2 - CARD_PADDING * 2 - GAP;
const PHOTO_WIDTH = AVAILABLE_WIDTH / COLS;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.25; // 4:5 aspect ratio

/**
 * PhotosSection Component
 *
 * Displays user's photos in a clean 2-column grid layout.
 * Supports replacing photos via image picker with 4:5 crop ratio.
 *
 * Features:
 * - 2-column grid layout matching card style
 * - Tap photo to replace
 * - Image cropping with 4:5 aspect ratio
 * - Uploading feedback
 * - Comprehensive logging and error handling
 */
export default function PhotosSection() {
  const { profile, refetch } = useProfile();
  const userId = useAuthStore((state) => state.userId);

  const photos = useMemo(
    () => Array.isArray(profile?.photos) ? profile.photos : [],
    [profile?.photos]
  );

  // Upload state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Animation refs for staggered entrance (initialize once)
  const fadeAnimsRef = useRef<Animated.Value[]>([]);

  // Initialize animation refs if needed
  if (fadeAnimsRef.current.length !== photos.length) {
    fadeAnimsRef.current = photos.map(() => new Animated.Value(0));
  }

  // Trigger entrance animation when photos count changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const animations = photos.map((_, index) =>
      Animated.timing(fadeAnimsRef.current[index], {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      })
    );

    Animated.stagger(0, animations).start();
    // We intentionally use only photos.length to avoid re-triggering animations
    // when photo content changes (new URLs) - we only want animation on mount
  }, [photos.length]);

  /**
   * Handle tapping a photo to replace it
   */
  const handleTapPhotoToReplace = useCallback(
    async (photoIndex: number) => {
      if (!userId) {
        logger.error("[PhotosSection] User ID not found");
        Alert.alert("Error", "You must be logged in to update photos.");
        return;
      }

      logger.debug("Tapping photo to replace", {
        userId,
        photoIndex,
      });

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 5],
          quality: 1,
        });

        if (result.canceled) {
          logger.debug("Image picker cancelled");
          return;
        }

        const imageUri = result.assets[0].uri;
        logger.debug("Image selected for replacement", {
          userId,
          photoIndex,
          imageUri,
        });

        // Set uploading state for this specific photo
        setUploadingIndex(photoIndex);

        try {
          const newPhotoUrl = await updatePhoto(userId, imageUri, photoIndex);

          logger.debug("Photo uploaded, saving to profile", {
            userId,
            photoIndex,
            newUrl: newPhotoUrl,
          });

          // Build updated photos array with new URL at the correct index
          const updatedPhotos = [...photos];
          updatedPhotos[photoIndex] = newPhotoUrl;

          // Save the updated photos array to the profile
          await profileApi.update(userId, {
            photos: updatedPhotos,
          });

          logger.info("Photo replaced successfully", {
            userId,
            photoIndex,
            newUrl: newPhotoUrl,
          });

          // Refetch profile to sync with server
          await refetch();

          Alert.alert("Success", "Photo updated successfully!");
        } catch (error) {
          logger.error("[PhotosSection] Failed to replace photo", {
            userId,
            photoIndex,
            error: error instanceof Error ? error.message : String(error),
          });
          Alert.alert(
            "Upload Failed",
            "Could not replace the photo. Please try again."
          );
        } finally {
          setUploadingIndex(null);
        }
      } catch (error) {
        logger.error("[PhotosSection] Failed to pick image", {
          userId,
          photoIndex,
          error: error instanceof Error ? error.message : String(error),
        });
        Alert.alert("Error", "Could not open image picker. Please try again.");
      }
    },
    [userId, photos, refetch]
  );

  // Empty state
  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={profileStyles.card}>
          <View style={styles.emptyHeader}>
            <Ionicons name="image-outline" size={24} color={PRIMARY} />
            <Text style={profileStyles.cardTitle}>Photos</Text>
          </View>
          <View style={styles.emptyContent}>
            <Ionicons name="add-circle-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>Add your first photo</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={profileStyles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="image" size={24} color={PRIMARY} />
          <Text style={profileStyles.cardTitle}>Photos</Text>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          {photos.map((photo, index) => (
            <Animated.View
              key={index}
              style={[
                styles.photoWrapper,
                { opacity: fadeAnimsRef.current[index] },
              ]}
            >
              <Pressable
                onPress={() => handleTapPhotoToReplace(index)}
                style={({ pressed }) => [
                  styles.photoCard,
                  pressed && styles.photoCardPressed,
                ]}
              >
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyPhoto}>
                    <Ionicons name="add-outline" size={32} color={MUTED} />
                  </View>
                )}

                {/* Uploading indicator */}
                {uploadingIndex === index && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="white" />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const SECTION_VERTICAL_PADDING = 8;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: SECTION_VERTICAL_PADDING,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  photoWrapper: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoCard: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  photoCardPressed: {
    opacity: 0.7,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  emptyPhoto: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  emptyContent: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
    fontStyle: "italic",
  },
});
