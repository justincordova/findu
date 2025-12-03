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
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { useEditMode } from "@/contexts/EditModeContext";
import { profileApi } from "@/api/profile";
import * as ImagePicker from "expo-image-picker";
import { uploadPhotos } from "@/services/uploadService";
import logger from "@/config/logger";
import { PRIMARY } from "@/constants/theme";

const { width, height } = Dimensions.get("window");
const IMAGE_SIZE = width * 0.8;

export default function PhotosSection() {
  const { data: profile, setField } = useProfileSetupStore();
  const userId = useAuthStore((state) => state.userId);
  const { isEditMode } = useEditMode();
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleAddPhoto = async () => {
    if (!isEditMode) return;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Please allow access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && userId) {
        setIsUpdating(true);
        const newPhotoUrls = await uploadPhotos(userId, [result.assets[0].uri]);
        const updatedPhotos = [...photos, ...newPhotoUrls];
        
        await profileApi.update(userId, { photos: updatedPhotos });
        setField("photos", updatedPhotos);
        
        Alert.alert("Success", "Photo added!");
      }
    } catch (error) {
      logger.error("Failed to add photo", { error });
      Alert.alert("Error", "Failed to add photo");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePhoto = async (index: number) => {
    if (!userId) return;

    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsUpdating(true);
              const updatedPhotos = photos.filter((_, i) => i !== index);
              await profileApi.update(userId, { photos: updatedPhotos });
              setField("photos", updatedPhotos);
              closeModal();
              Alert.alert("Success", "Photo deleted!");
            } catch (error) {
              logger.error("Failed to delete photo", { error });
              Alert.alert("Error", "Failed to delete photo");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        {isEditMode && (
          <TouchableOpacity onPress={handleAddPhoto} style={styles.addButton} disabled={isUpdating}>
            <Text style={styles.addButtonText}>+ Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {photos.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
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

              {isEditMode && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(currentIndex)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteText}>🗑️ Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  addButton: {
    padding: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
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
  deleteButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 12,
    backgroundColor: "rgba(239,68,68,0.9)",
    borderRadius: 8,
  },
  deleteText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
  },
  closeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
