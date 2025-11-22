import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { updatePhoto } from "@/services/uploadService";
import logger from "@/config/logger";

const { width, height } = Dimensions.get("window");
const IMAGE_SIZE = width * 0.8;

export default function PhotosSection() {
  const { data: profile } = useProfileSetupStore();
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];
  const userId = useAuthStore.getState().userId;

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

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

  const renderPhotoItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <TouchableOpacity
      onPress={() => openModal(index)}
      activeOpacity={0.8}
      style={styles.photoContainer}
    >
      <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
    </TouchableOpacity>
  );

  const renderModalPhoto = ({ item }: { item: string }) => (
    <Image
      source={{ uri: item }}
      style={styles.fullscreenImage}
      resizeMode="contain"
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No photos added</Text>
    </View>
  );

  if (photos.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>

      <FlatList
        data={photos}
        keyExtractor={(item, index) => `photo-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={renderPhotoItem}
        snapToInterval={IMAGE_SIZE + 16}
        decelerationRate="fast"
      />

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={currentIndex}
            keyExtractor={(item, index) => `modal-photo-${index}`}
            renderItem={renderModalPhoto}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
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
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  photoContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  photo: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
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
    height,
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

