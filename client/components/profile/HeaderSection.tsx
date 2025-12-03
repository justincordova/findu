import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { DARK, MUTED, PRIMARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { useEditMode } from "@/contexts/EditModeContext";
import { profileApi } from "@/api/profile";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar } from "@/services/uploadService";
import logger from "@/config/logger";

const AVATAR_SIZE = 120;
const { width } = Dimensions.get("window");

/** Calculate age from birthdate */
function calculateAge(birthdate: string | undefined): number | null {
  if (!birthdate) return null;

  try {
    const birth = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1;
    }

    return age;
  } catch {
    return null;
  }
}

export default function HeaderSection() {
  const { data: profile, setField } = useProfileSetupStore();
  const userId = useAuthStore((state) => state.userId);
  const { isEditMode } = useEditMode();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<"name" | "gender" | "intent" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const avatarUrl = profile?.avatar_url;
  const name = profile?.name || "";
  const gender = profile?.gender || "";
  const intent = profile?.intent || "";
  const age = calculateAge(profile?.birthdate);

  // Build display name safely
  const getDisplayName = (): string => {
    if (name && age !== null) {
      return `${name}, ${age}`;
    }
    if (name) {
      return name;
    }
    if (age !== null) {
      return `${age}`;
    }
    return "";
  };

  const displayName = getDisplayName();

  const handleAvatarPress = async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && userId) {
        setIsUpdating(true);
        const newAvatarUrl = await uploadAvatar(userId, result.assets[0].uri);
        
        await profileApi.update(userId, { avatar_url: newAvatarUrl });
        setField("avatar_url", newAvatarUrl);
        
        Alert.alert("Success", "Avatar updated!");
      }
    } catch (error) {
      logger.error("Failed to update avatar", { error });
      Alert.alert("Error", "Failed to update avatar");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (field: "name" | "gender" | "intent", currentValue: string) => {
    if (!isEditMode) return;
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editField || !userId) return;

    try {
      setIsUpdating(true);
      await profileApi.update(userId, { [editField]: editValue });
      setField(editField, editValue);
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      logger.error("Failed to update profile", { error });
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleAvatarPress} 
        activeOpacity={isEditMode ? 0.7 : 1} 
        disabled={isUpdating || !isEditMode}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {isEditMode ? "Tap to Add" : "No Avatar"}
            </Text>
          </View>
        )}
        {isEditMode && (
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏️</Text>
          </View>
        )}
      </TouchableOpacity>

      {displayName ? (
        <TouchableOpacity 
          onPress={() => openEditModal("name", name)}
          activeOpacity={isEditMode ? 0.7 : 1}
          disabled={!isEditMode}
        >
          <Text style={styles.name}>{displayName}</Text>
        </TouchableOpacity>
      ) : null}

      {gender ? (
        <TouchableOpacity 
          onPress={() => openEditModal("gender", gender)}
          activeOpacity={isEditMode ? 0.7 : 1}
          disabled={!isEditMode}
        >
          <Text style={styles.subText}>{gender}</Text>
        </TouchableOpacity>
      ) : null}

      {intent ? (
        <TouchableOpacity 
          onPress={() => openEditModal("intent", intent)}
          activeOpacity={isEditMode ? 0.7 : 1}
          disabled={!isEditMode}
        >
          <Text style={styles.subText}>{intent}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editField}`}
              autoCapitalize="words"
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
                onPress={handleSaveEdit}
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
    width,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: MUTED,
    fontSize: 14,
  },
  editBadge: {
    position: "absolute",
    bottom: 16,
    right: 0,
    backgroundColor: PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  editBadgeText: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 4,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
    marginBottom: 2,
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
