// React core
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// React Native
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Project imports
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { updatePhoto } from "@/services/uploadService";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";

// Constants
const { width } = Dimensions.get("window");
const PADDING = 16;
const GAP = 12;
const PHOTO_WIDTH = (width - PADDING * 2 - GAP) / 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.25; // 4:5 aspect ratio
const PHOTO_BORDER_RADIUS = 12;
// Carousel height: full width with 4:5 aspect ratio to match photos
const CAROUSEL_HEIGHT = (width / 4) * 5; // 4:5 aspect ratio = width * 1.25

/**
 * PhotosSection Component
 *
 * Displays user's 6 photos in a carousel view at the top of profile.
 * Supports replacing photos via image picker with 4:5 crop ratio.
 *
 * Features:
 * - Horizontal carousel with swipe navigation
 * - Tap photo to replace (discrete pencil icon indicator)
 * - Image cropping with 4:5 aspect ratio
 * - Photo indicators (dots) at bottom of carousel
 * - Uploading feedback overlay
 * - Comprehensive logging and error handling
 */
export default function PhotosSection() {
  const { profile, refetch } = useProfile();
  const userId = useAuthStore.getState().userId;

  const photos = useMemo(
    () => Array.isArray(profile?.photos) ? profile.photos : [],
    [profile?.photos]
  );

  // Carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // FlatList ref for carousel scrolling
  const flatListRef = useRef<FlatList>(null);

  // Scroll to selected photo when index changes
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentPhotoIndex,
          animated: true,
        });
      }, 100);
    }
  }, [currentPhotoIndex]);


  /**
   * Handle tapping carousel photo to replace it
   */
  const handleTapPhotoToReplace = useCallback(async () => {
    if (!userId) {
      logger.error("[PhotosSection] User ID not found");
      Alert.alert("Error", "You must be logged in to update photos.");
      return;
    }

    logger.debug("Tapping photo to replace", {
      userId,
      photoIndex: currentPhotoIndex,
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
        photoIndex: currentPhotoIndex,
        imageUri,
      });

      // Upload photo and get the new URL
      setIsUploading(true);

      try {
        const newPhotoUrl = await updatePhoto(userId, imageUri, currentPhotoIndex);

        logger.debug("Photo uploaded, saving to profile", {
          userId,
          photoIndex: currentPhotoIndex,
          newUrl: newPhotoUrl,
        });

        // Build updated photos array with new URL at the correct index
        const updatedPhotos = [...photos];
        updatedPhotos[currentPhotoIndex] = newPhotoUrl;

        // Save the updated photos array to the profile
        await profileApi.update(userId, {
          photos: updatedPhotos,
        });

        logger.info("Photo replaced successfully", {
          userId,
          photoIndex: currentPhotoIndex,
          newUrl: newPhotoUrl,
        });

        // Refetch profile to sync with server
        await refetch();

        Alert.alert("Success", "Photo updated successfully!");
      } catch (error) {
        logger.error("[PhotosSection] Failed to replace photo", {
          userId,
          photoIndex: currentPhotoIndex,
          error: error instanceof Error ? error.message : String(error),
        });
        Alert.alert(
          "Upload Failed",
          "Could not replace the photo. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      logger.error("[PhotosSection] Failed to pick image", {
        userId,
        photoIndex: currentPhotoIndex,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Could not open image picker. Please try again.");
    }
  }, [userId, currentPhotoIndex, photos, refetch]);


  /**
   * Render photo indicators (dots showing current position in carousel)
   */
  const renderIndicators = () => (
    <View style={styles.indicatorsContainer}>
      {photos.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            currentPhotoIndex === index && styles.indicatorActive,
          ]}
        />
      ))}
    </View>
  );

  /**
   * Render carousel FlatList
   */
  const renderCarousel = () => (
    <FlatList
      ref={flatListRef}
      data={photos}
      horizontal
      pagingEnabled
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => `carousel-photo-${index}`}
      initialScrollIndex={currentPhotoIndex}
      getItemLayout={(_, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      onMomentumScrollEnd={(event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / width);
        setCurrentPhotoIndex(newIndex);
      }}
      renderItem={({ item: photo }) => (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTapPhotoToReplace}
          style={styles.carouselPhotoContainer}
        >
          <Image
            source={{ uri: photo }}
            style={styles.carouselPhoto}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
      onScrollToIndexFailed={(info) => {
        // Fallback if scroll fails
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
        }, 100);
      }}
    />
  );

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos added</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Carousel Display */}
      <View style={styles.carouselContainer}>
        {renderCarousel()}
        {renderIndicators()}

        {/* Uploading overlay */}
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.uploadingText}>Updating photo...</Text>
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gridContainer: {
    marginHorizontal: -PADDING,
    paddingHorizontal: PADDING,
  },
  row: {
    flexDirection: "row",
    marginBottom: GAP,
    gap: GAP,
  },
  photoContainer: {
    borderRadius: PHOTO_BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: PHOTO_BORDER_RADIUS,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  carouselContainer: {
    position: "relative",
    width: "100%",
    height: CAROUSEL_HEIGHT,
    backgroundColor: "#1f2937",
    borderRadius: 0,
    overflow: "hidden",
  },
  carouselBackground: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  carouselPhotoContainer: {
    width,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselPhoto: {
    width,
    height: "100%",
  },
  tapHintOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    width: "100%",
    height: "100%",
  },
  indicatorsContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  indicator: {
    flex: 1,
    maxWidth: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  indicatorActive: {
    backgroundColor: "rgba(255,255,255,1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    zIndex: 100,
  },
  uploadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
});

