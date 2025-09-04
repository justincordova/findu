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
} from "react-native";
import { useProfileSetupStore } from "@/store/profileStore";

const { width, height } = Dimensions.get("window");
const IMAGE_SIZE = width * 0.8;

export default function PhotosSection() {
  const { data: profile } = useProfileSetupStore();
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
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

          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
            activeOpacity={0.8}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
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
