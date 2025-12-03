import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { DARK, MUTED, PRIMARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { useEditMode } from "@/contexts/EditModeContext";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";

export default function AboutSection() {
  const { data: profile, setField } = useProfileSetupStore();
  const userId = useAuthStore((state) => state.userId);
  const { isEditMode } = useEditMode();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const bio = profile?.bio || "";
  const interests = Array.isArray(profile?.interests)
    ? profile.interests.filter(Boolean).map(String)
    : [];

  const handleEditBio = () => {
    if (!isEditMode) return;
    setBioValue(bio);
    setEditModalVisible(true);
  };

  const handleSaveBio = async () => {
    if (!userId) return;

    try {
      setIsUpdating(true);
      await profileApi.update(userId, { bio: bioValue });
      setField("bio", bioValue);
      setEditModalVisible(false);
      Alert.alert("Success", "Bio updated!");
    } catch (error) {
      logger.error("Failed to update bio", { error });
      Alert.alert("Error", "Failed to update bio");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderInterest = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.interestBadge}>
      <Text style={styles.interestText}>{item}</Text>
    </View>
  );

  const renderInterests = () => {
    if (interests.length === 0) {
      return <Text style={styles.content}>No interests added.</Text>;
    }

    return (
      <FlatList
        data={interests}
        keyExtractor={(item, index) => `interest-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.interestsContainer}
        renderItem={renderInterest}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>About</Text>
        {isEditMode && (
          <TouchableOpacity onPress={handleEditBio} style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>Bio</Text>
      <Text style={styles.content}>{bio || "No bio provided."}</Text>

      <Text style={styles.subtitle}>Interests</Text>
      {renderInterests()}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Bio</Text>
            <TextInput
              style={styles.modalInput}
              value={bioValue}
              onChangeText={setBioValue}
              placeholder="Enter your bio"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveBio}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    color: DARK,
    marginBottom: 12,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: DARK,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: DARK,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: PRIMARY,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
