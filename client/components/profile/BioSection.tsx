// React core
import { useCallback, useState } from "react";

// React Native
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { profileStyles } from "./shared/profileStyles";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";
import { MUTED, PRIMARY } from "@/constants/theme";

/**
 * BioSection Component
 *
 * Displays and manages user's bio
 *
 * Features:
 * - Multi-line bio text editing
 * - Comprehensive logging and error handling
 */
export default function BioSection() {
  const { profile, refetch } = useProfile();
  const userId = useAuthStore((state) => state.userId);

  // Display data
  const bio = profile?.bio || "";

  // Modal state
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [editingBio, setEditingBio] = useState(bio);
  const [isSaving, setIsSaving] = useState(false);

  // Open main edit modal
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening bio edit modal", {
      userId,
      currentLength: bio.length,
    });
    setEditingBio(bio);
    setMainModalVisible(true);
  }, [bio, userId]);

  const handleCloseModal = useCallback(() => {
    setMainModalVisible(false);
  }, []);

  /**
   * Save bio to profile
   */
  const handleSaveBio = useCallback(async () => {
    if (!userId) {
      logger.error("[BioSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    try {
      setIsSaving(true);
      logger.debug("Saving bio", {
        userId,
        bioLength: editingBio.length,
      });

      await profileApi.update(userId, {
        bio: editingBio,
      });

      logger.info("Bio updated successfully", {
        userId,
        bioLength: editingBio.length,
      });

      // Refetch to sync with server
      await refetch();

      handleCloseModal();
      Alert.alert("Success", "Bio updated!");
    } catch (error) {
      logger.error("Failed to update bio", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, editingBio, refetch, handleCloseModal]);

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <TouchableOpacity
        style={profileStyles.card}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <View style={[profileStyles.cardHeader, styles.headerNoChevron]}>
          <Ionicons name="document-text-outline" size={24} color={PRIMARY} />
          <Text style={profileStyles.cardTitle}>About Me</Text>
        </View>

        {/* Bio Text */}
        {bio ? (
          <Text style={profileStyles.bioText} numberOfLines={3}>
            {bio}
          </Text>
        ) : (
          <Text style={styles.emptyText}>No bio added yet</Text>
        )}
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={mainModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={profileStyles.modalOverlay}
        >
          <View style={profileStyles.modalContent}>
            {/* Modal Header */}
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Edit Bio</Text>
              <TouchableOpacity onPress={handleCloseModal} disabled={isSaving}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isSaving ? "#ccc" : "#000"}
                />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={profileStyles.formContainer}>
                {/* Bio Text Area */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Bio</Text>
                  <TextInput
                    style={[
                      profileStyles.modalTextArea,
                      editingBio && profileStyles.formInputFilled,
                    ]}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor="#9CA3AF"
                    value={editingBio}
                    onChangeText={setEditingBio}
                    editable={!isSaving}
                    multiline
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>
                    {editingBio.length}/500
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={profileStyles.modalButtons}>
              <TouchableOpacity
                style={[
                  profileStyles.modalCancelButton,
                  isSaving && { opacity: 0.5 },
                ]}
                onPress={handleCloseModal}
                disabled={isSaving}
              >
                <Text style={profileStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  profileStyles.modalSaveButton,
                  isSaving && { opacity: 0.5 },
                ]}
                onPress={handleSaveBio}
                disabled={isSaving}
              >
                <Text style={profileStyles.modalSaveText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  headerNoChevron: {
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 14,
    color: MUTED,
    fontStyle: "italic",
  },

  charCount: {
    fontSize: 12,
    color: MUTED,
    textAlign: "right",
    marginTop: 4,
  },
});
