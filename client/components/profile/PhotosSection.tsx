import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { updatePhoto } from "@/services/uploadService";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";

const { width } = Dimensions.get("window");
const PADDING = 16;
const GAP = 12;
const PHOTO_WIDTH = (width - PADDING * 2 - GAP) / 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.25; // 4:5 aspect ratio

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

    logger.info("[PhotosSection] Modal opened for photo replacement", {
      userId,
      photoIndex: currentIndex
    });

    logger.info("[PhotosSection] Requesting media library permission", {
      userId,
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

    logger.info("[PhotosSection] Permission granted, launching image picker", {
      userId,
      photoIndex: currentIndex
    });

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (pickerResult.canceled) {
      logger.info("[PhotosSection] Image picker cancelled by user", {
        userId,
        photoIndex: currentIndex
      });
      return;
    }

    const newUri = pickerResult.assets[0].uri;
    logger.info("[PhotosSection] Image selected for replacement", {
      userId,
      photoIndex: currentIndex,
      uri: newUri
    });

    closeModal(); // Close the modal before upload
    setIsUploading(true);

    try {
      logger.info("[PhotosSection] Starting photo upload", {
        userId,
        photoIndex: currentIndex
      });

      const newPhotoUrl = await updatePhoto(userId, newUri, currentIndex);

      logger.info("[PhotosSection] Photo replaced successfully", {
        userId,
        photoIndex: currentIndex,
        newUrl: newPhotoUrl
      });

      // Update the store with the new photo URL
      // This ensures correct extension is displayed after upload
      const currentPhotos = Array.isArray(profile?.photos) ? [...profile.photos] : [];
      currentPhotos[currentIndex] = newPhotoUrl;
      useProfileSetupStore.getState().setProfileField("photos", currentPhotos);

      logger.info("[PhotosSection] Updated store with new photo URL", {
        userId,
        photoIndex: currentIndex,
        newUrl: newPhotoUrl
      });

      // Update the profile in the database with the new photo URL
      logger.info("[PhotosSection] Updating profile in database with new photo URL", {
        userId,
        photoIndex: currentIndex,
        newUrl: newPhotoUrl
      });
      await profileApi.update(userId, { photos: currentPhotos });

      logger.info("[PhotosSection] Profile updated in database with new photo URL", {
        userId,
        photoIndex: currentIndex
      });

      Alert.alert("Success", "Photo updated successfully!");
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
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1f2937",
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
    borderRadius: 12,
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
    borderRadius: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
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
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  uploadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
});

