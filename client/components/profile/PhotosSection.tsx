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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { updatePhoto } from "@/services/uploadService";
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
      Alert.alert("Error", "You must be logged in to update photos.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to your photos.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      // @ts-ignore
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    const newUri = pickerResult.assets[0].uri;
    closeModal(); // Close the modal before upload

    try {
      await updatePhoto(userId, newUri, currentIndex);
      Alert.alert("Success", "Photo updated successfully!");
    } catch (error) {
      logger.error("Failed to replace photo", { error });
      Alert.alert("Upload Failed", "Could not replace the photo. Please try again.");
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
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
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
              style={styles.actionButton}
              onPress={handleReplacePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.actionText}>Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={closeModal}
              activeOpacity={0.8}
            >
              <Text style={styles.actionText}>Close</Text>
            </TouchableOpacity>
          </View>
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
});

