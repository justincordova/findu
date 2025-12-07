// React core
import { useEffect, useRef, useState } from "react";

// React Native
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Project imports
import { useProfileSetupStore } from "@/store/profileStore";
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
const CONTAINER_MARGIN_BOTTOM = 24;
const TITLE_FONT_SIZE = 20;
const TITLE_FONT_WEIGHT = "700";
const TITLE_COLOR = "#1f2937";
const TITLE_MARGIN_BOTTOM = 12;
const PHOTO_BORDER_RADIUS = 12;
const EMPTY_PADDING = 16;
const EMPTY_TEXT_COLOR = "#6b7280";
const EMPTY_TEXT_SIZE = 14;
const EMPTY_BG = "#f9fafb";
const MODAL_BOTTOM = 40;
const ACTION_BUTTON_PADDING_V = 12;
const ACTION_BUTTON_PADDING_H = 24;
const ACTION_BUTTON_RADIUS = 8;
const ACTION_TEXT_SIZE = 16;
const ACTION_TEXT_WEIGHT = "600";
const UPLOAD_OVERLAY_BG = "rgba(0, 0, 0, 0.6)";
const UPLOAD_TEXT_SIZE = 16;
const UPLOAD_TEXT_WEIGHT = "600";
const UPLOAD_TEXT_MARGIN_TOP = 12;
const UPLOAD_GAP = 16;

/**
 * Photos section component with grid display and fullscreen modal
 * Supports replacing individual photos via image picker with upload feedback
 */
export default function PhotosSection() {
  const { data: profile } = useProfileSetupStore();
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];
  const userId = useAuthStore.getState().userId;

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    if (modalVisible && flatListRef.current) {
      // Scroll to the current index when modal opens
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentIndex,
          animated: false,
        });
      }, 100);
    }
  }, [modalVisible, currentIndex]);

  const handleReplacePhoto = async () => {
    if (!userId) {
      logger.error("[PhotosSection] User ID not found");
      Alert.alert("Error", "You must be logged in to update photos.");
      return;
    }

    logger.debug("Modal opened for photo replacement", {
      photoIndex: currentIndex
    });

    logger.debug("Requesting media library permission", {
      photoIndex: currentIndex
    });

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      logger.warn("[PhotosSection] Media library permission denied", {
        userId,
        photoIndex: currentIndex
      });
      Alert.alert("Permission required", "You need to allow access to your photos.");
      return;
    }

    logger.debug("Permission granted, launching picker", {
      photoIndex: currentIndex
    });

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (pickerResult.canceled) {
      logger.debug("Image picker cancelled", {
        photoIndex: currentIndex
      });
      return;
    }

    const newUri = pickerResult.assets[0].uri;
    logger.debug("Image selected", {
      photoIndex: currentIndex
    });

    setIsUploading(true);

    try {
      logger.info("Photo upload started", {
        photoIndex: currentIndex
      });

      const newPhotoUrl = await updatePhoto(userId, newUri, currentIndex);

      logger.info("Photo replaced", {
        photoIndex: currentIndex
      });

      // Update the store with the new photo URL
      // This ensures correct extension is displayed after upload
      const currentPhotos = Array.isArray(profile?.photos) ? [...profile.photos] : [];
      currentPhotos[currentIndex] = newPhotoUrl;
      useProfileSetupStore.getState().setProfileField("photos", currentPhotos);

      logger.debug("Updated store with new URL", {
        photoIndex: currentIndex
      });

      // Update the profile in the database with the new photo URL
      logger.debug("Updating profile in database", {
        photoIndex: currentIndex
      });
      await profileApi.update(userId, { photos: currentPhotos });

      logger.info("Profile updated in database", {
        photoIndex: currentIndex
      });

      Alert.alert("Success", "Photo updated successfully!");
      closeModal(); // Close the modal after successful upload
    } catch (error) {
      logger.error("[PhotosSection] Failed to replace photo", {
        userId,
        photoIndex: currentIndex,
        error: error instanceof Error ? error.message : String(error)
      });
      Alert.alert("Upload Failed", "Could not replace the photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No photos added</Text>
    </View>
  );

  if (photos.length === 0) {
    return renderEmptyState();
  }

  // Create a 2x3 grid (6 photos max)
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < photos.length; i += 2) {
      const rowPhotos = photos.slice(i, i + 2);
      rows.push(
        <View key={i} style={styles.row}>
          {rowPhotos.map((photo: string, idx: number) => {
            const photoIndex = i + idx;
            return (
              <TouchableOpacity
                key={photoIndex}
                onPress={() => openModal(photoIndex)}
                activeOpacity={0.8}
                style={styles.photoContainer}
              >
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            );
          })}
          {/* Fill empty space if odd number of photos in last row */}
          {rowPhotos.length === 1 && <View style={styles.photoContainer} />}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>

      <View style={styles.gridContainer}>{renderGrid()}</View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <FlatList
            ref={flatListRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `modal-photo-${index}`}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item: photo }) => (
              <Image
                source={{ uri: photo }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
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

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, isUploading && styles.actionButtonDisabled]}
              onPress={handleReplacePhoto}
              activeOpacity={0.8}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.actionText}>Replace</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, isUploading && styles.actionButtonDisabled]}
              onPress={closeModal}
              activeOpacity={0.8}
              disabled={isUploading}
            >
              <Text style={styles.actionText}>Close</Text>
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.uploadingText}>Updating photo...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: CONTAINER_MARGIN_BOTTOM,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    marginBottom: TITLE_MARGIN_BOTTOM,
    color: TITLE_COLOR,
  },
  gridContainer: {
    paddingHorizontal: 0,
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
    padding: EMPTY_PADDING,
    alignItems: "center",
    backgroundColor: EMPTY_BG,
    borderRadius: PHOTO_BORDER_RADIUS,
  },
  emptyText: {
    color: EMPTY_TEXT_COLOR,
    fontSize: EMPTY_TEXT_SIZE,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width,
    height: "100%",
  },
  modalActions: {
    position: "absolute",
    bottom: MODAL_BOTTOM,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingVertical: ACTION_BUTTON_PADDING_V,
    paddingHorizontal: ACTION_BUTTON_PADDING_H,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: ACTION_BUTTON_RADIUS,
  },
  actionText: {
    color: "white",
    fontWeight: ACTION_TEXT_WEIGHT,
    fontSize: ACTION_TEXT_SIZE,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: UPLOAD_OVERLAY_BG,
    justifyContent: "center",
    alignItems: "center",
    gap: UPLOAD_GAP,
  },
  uploadingText: {
    color: "white",
    fontSize: UPLOAD_TEXT_SIZE,
    fontWeight: UPLOAD_TEXT_WEIGHT,
    marginTop: UPLOAD_TEXT_MARGIN_TOP,
  },
});

