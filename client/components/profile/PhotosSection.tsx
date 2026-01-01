// React core
import { useCallback, useMemo, useRef, useState } from "react";

// React Native
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { MUTED, GRADIENT } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = 16; // Padding from container
const CAROUSEL_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING * 2; // Account for left/right padding
const CAROUSEL_HEIGHT = (CAROUSEL_WIDTH * 5) / 4; // Exact 4:5 aspect ratio

/**
 * PhotosSection Component
 *
 * Displays user's photos in a horizontal carousel with flat rectangle indicators.
 * Supports replacing photos via image picker with 4:5 crop ratio.
 *
 * Features:
 * - Horizontal carousel layout for efficient space usage
 * - Flat rectangle indicators at the bottom (highlight current index)
 * - Tap photo to replace with new image
 * - Image cropping with 4:5 aspect ratio
 * - Uploading feedback with spinner
 * - Comprehensive logging and error handling
 */
export default function PhotosSection() {
  const { profile, refetch, isEditable = true } = useProfile();
  const userId = useAuthStore((state) => state.userId);

  const photos = useMemo(
    () => Array.isArray(profile?.photos) ? profile.photos : [],
    [profile?.photos]
  );

  // Upload state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Handle carousel scroll to update active indicator
   */
  const handleCarouselScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
  }, [photos.length]);

  /**
   * Handle tapping a photo to replace it
   */
  const handleTapPhotoToReplace = useCallback(
    async (photoIndex: number) => {
      if (!isEditable) {
        return;
      }

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
    [userId, photos, refetch, isEditable]
  );

  // Empty state - don't show section if no photos
  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          style={styles.carousel}
        >
          {photos.map((photo, index) => (
            <Pressable
              key={index}
              onPress={() => handleTapPhotoToReplace(index)}
              style={({ pressed }) => [
                styles.photo,
                pressed && styles.photoPressed,
              ]}
            >
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.emptyPhoto}>
                  <Ionicons name="add-outline" size={32} color={MUTED} />
                </View>
              )}

              {uploadingIndex === index && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {photos.length > 1 && (
          <View style={styles.indicatorsContainer}>
            {photos.map((_, index) => (
              index === currentPhotoIndex ? (
                <LinearGradient
                  key={index}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.indicator}
                />
              ) : (
                <View
                  key={index}
                  style={styles.indicator}
                />
              )
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  carouselWrapper: {
    width: "100%",
    height: CAROUSEL_HEIGHT + 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  carousel: {
    width: "100%",
    height: CAROUSEL_HEIGHT,
  },
  photo: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
  },
  photoPressed: {
    opacity: 0.7,
  },
  photoImage: {
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
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  indicator: {
    flex: 1,
    maxWidth: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
});
