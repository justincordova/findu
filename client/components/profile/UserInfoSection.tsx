// React core
import { useCallback, useMemo, useState } from "react";

// React Native
import {
  Alert,
  Dimensions,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { profileStyles } from "./shared/profileStyles";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/uploadService";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";
import { DARK, MUTED, PRIMARY, SECONDARY } from "@/constants/theme";

/**
 * UserInfoSection Component
 *
 * Displays and manages user's profile information:
 * - Avatar with tap-to-upload
 * - Name with tap-to-edit
 * - Birthdate with date picker
 * - Gender dropdown selection
 * - Pronouns dropdown selection
 * - University display
 *
 * Features:
 * - Avatar upload with 1:1 aspect ratio
 * - Name editing via modal
 * - Birthdate selection with DateTimePicker
 * - Gender and pronouns dropdowns from constants store
 * - Comprehensive logging and error handling
 */

/** Calculate age from birthdate accounting for month/day not yet passed */
function calculateAge(birthdate: string | undefined): number | null {
  if (!birthdate) return null;
  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  } catch {
    return null;
  }
}

type DropdownKey = "gender" | "pronouns" | null;

export default function UserInfoSection() {
  const { profile, refetch } = useProfile();
  const userId = useAuthStore((state) => state.userId);

  // Display data
  const avatarUrl = profile?.avatar_url;
  const name = profile?.name || "";
  const birthdate = profile?.birthdate;
  const gender = profile?.gender || "";
  const pronouns = profile?.pronouns || "";
  const university = profile?.university_name || "";
  const age = calculateAge(birthdate);

  // Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);

  // Editing state
  const [editingName, setEditingName] = useState(name);
  const [editingBirthdate, setEditingBirthdate] = useState(birthdate);
  const [editingGender, setEditingGender] = useState(gender);
  const [editingPronouns, setEditingPronouns] = useState(pronouns);
  const [isSaving, setIsSaving] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const emptyCallback = useCallback(() => {}, []);

  // Max birthdate = today minus 18 years
  const maxBirthdate = useMemo(() => {
    const today = new Date();
    return new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
  }, []);

  // Dropdown options from constants
  const genderItems = useMemo(
    () => [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const pronounsItems = useMemo(
    () => [
      { label: "they/them", value: "they/them" },
      { label: "he/him", value: "he/him" },
      { label: "she/her", value: "she/her" },
      { label: "xe/xem", value: "xe/xem" },
      { label: "ze/zir", value: "ze/zir" },
      { label: "other", value: "other" },
    ],
    []
  );

  /**
   * Open edit modal
   */
  const handleOpenEditModal = useCallback(() => {
    logger.debug("Opening user info edit modal", {
      userId,
      currentName: name,
      currentBirthdate: birthdate,
    });
    setEditingName(name);
    setEditingBirthdate(birthdate);
    setEditingGender(gender);
    setEditingPronouns(pronouns);
    setEditModalVisible(true);
  }, [name, birthdate, gender, pronouns, userId]);

  /**
   * Close edit modal
   */
  const handleCloseEditModal = useCallback(() => {
    setEditModalVisible(false);
    setBirthdateError(null);
  }, []);

  /**
   * Handle date picker confirmation
   */
  const handleDateConfirm = (date: Date) => {
    if (date > maxBirthdate) {
      setBirthdateError("You must be at least 18 years old");
    } else {
      setBirthdateError(null);
      setEditingBirthdate(date.toISOString());
    }
    setShowDatePicker(false);
  };

  /**
   * Handle dropdown open/close
   */
  const handleDropdownOpen = (key: DropdownKey) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const getZIndex = (key: DropdownKey, baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  /**
   * Save user info to profile
   */
  const handleSaveUserInfo = useCallback(async () => {
    if (!userId) {
      logger.error("[UserInfoSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    // Validate inputs
    if (!editingName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (!editingBirthdate) {
      Alert.alert("Error", "Please select a birthdate");
      return;
    }

    if (!editingGender) {
      Alert.alert("Error", "Please select a gender");
      return;
    }

    if (!editingPronouns) {
      Alert.alert("Error", "Please select pronouns");
      return;
    }

    try {
      setIsSaving(true);
      logger.debug("Saving user info", {
        userId,
        name: editingName,
        birthdate: editingBirthdate,
        gender: editingGender,
        pronouns: editingPronouns,
      });

      await profileApi.update(userId, {
        name: editingName.trim(),
        birthdate: editingBirthdate,
        gender: editingGender,
        pronouns: editingPronouns,
      });

      logger.info("User info updated successfully", {
        userId,
        name: editingName,
        gender: editingGender,
        pronouns: editingPronouns,
      });

      // Refetch to sync with server
      await refetch();

      handleCloseEditModal();
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      logger.error("Failed to update user info", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, editingName, editingBirthdate, editingGender, editingPronouns, refetch, handleCloseEditModal]);

  /**
   * Handle avatar upload
   */
  const handleUpdateAvatar = useCallback(async () => {
    if (!userId) {
      logger.error("[UserInfoSection] User ID not found for avatar upload");
      Alert.alert("Error", "You must be logged in to update your avatar");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) {
        logger.debug("[UserInfoSection] Avatar upload cancelled");
        return;
      }

      const imageUri = result.assets[0].uri;

      logger.debug("[UserInfoSection] Avatar image selected", { userId, imageUri });

      // Upload avatar
      const newAvatarUrl = await uploadAvatar(userId, imageUri, "update");

      logger.debug("[UserInfoSection] Avatar uploaded, saving to profile", {
        userId,
        newUrl: newAvatarUrl,
      });

      // Save avatar URL to profile
      await profileApi.update(userId, {
        avatar_url: newAvatarUrl,
      });

      logger.info("[UserInfoSection] Avatar updated successfully", {
        userId,
        url: newAvatarUrl,
      });

      // Refetch profile
      await refetch();

      Alert.alert("Success", "Avatar updated successfully!");
    } catch (error) {
      logger.error("[UserInfoSection] Failed to update avatar", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert(
        "Upload Failed",
        "Could not update your avatar. Please try again."
      );
    }
  }, [userId, refetch]);

  const displayName = name ? (age !== null ? `${name}, ${age}` : name) : age !== null ? `${age}` : "";

  return (
    <View style={styles.container}>
      {/* Card Wrapper */}
      <View style={profileStyles.card}>
        {/* Avatar - Tap to update */}
        <TouchableOpacity
          onPress={handleUpdateAvatar}
          activeOpacity={0.7}
          style={styles.avatarContainer}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="camera-outline" size={40} color={MUTED} />
            </View>
          )}
        </TouchableOpacity>

        {/* Info - Tap to edit */}
        <TouchableOpacity onPress={handleOpenEditModal} activeOpacity={0.7} style={{ flex: 1 }}>
          {displayName ? (
            <Text style={styles.name}>{displayName}</Text>
          ) : null}

          {/* University - Display only */}
          {university && (
            <View style={styles.universityRow}>
              <Ionicons name="school" size={16} color="#666" />
              <Text style={styles.universityText}>{university}</Text>
            </View>
          )}

          {/* Gender and Pronouns - Display only */}
          {(gender || pronouns) && (
            <View style={[profileStyles.infoGrid, styles.infoPadding]}>
              {gender && (
                <View style={profileStyles.infoItem}>
                  <Ionicons
                    name="male-female-outline"
                    size={20}
                    color={PRIMARY}
                  />
                  <View style={profileStyles.infoTextContainer}>
                    <Text style={profileStyles.infoLabel}>Gender</Text>
                    <Text style={profileStyles.infoValue}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </View>
                </View>
              )}

              {pronouns && (
                <View style={profileStyles.infoItem}>
                  <Ionicons name="chatbox-outline" size={20} color={PRIMARY} />
                  <View style={profileStyles.infoTextContainer}>
                    <Text style={profileStyles.infoLabel}>Pronouns</Text>
                    <Text style={profileStyles.infoValue}>{pronouns}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={profileStyles.modalOverlay}
        >
          <View style={profileStyles.modalContent}>
            {/* Modal Header */}
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCloseEditModal} disabled={isSaving}>
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
                {/* Name Input */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Name</Text>
                  <TextInput
                    style={[
                      profileStyles.formInput,
                      editingName && profileStyles.formInputFilled,
                    ]}
                    placeholder="Enter your first name"
                    placeholderTextColor="#9CA3AF"
                    value={editingName}
                    onChangeText={setEditingName}
                    editable={!isSaving}
                    returnKeyType="done"
                  />
                </View>

                {/* Birthdate Input */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Birthdate</Text>
                  <TouchableOpacity
                    style={[
                      profileStyles.formInput,
                      editingBirthdate && profileStyles.formInputFilled,
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isSaving}
                  >
                    <Text style={{ fontSize: 16, color: editingBirthdate ? DARK : "#9CA3AF" }}>
                      {editingBirthdate
                        ? new Date(editingBirthdate).toLocaleDateString()
                        : "Select your birthdate"}
                    </Text>
                  </TouchableOpacity>
                  {birthdateError && (
                    <Text style={styles.errorText}>{birthdateError}</Text>
                  )}
                </View>

                {/* Gender Dropdown */}
                <View style={[profileStyles.formField, { zIndex: getZIndex("gender", 2) }]}>
                  <Text style={profileStyles.formLabel}>Gender</Text>
                  <DropDownPicker<string>
                    placeholder="Select your gender"
                    open={activeDropdown === "gender"}
                    value={editingGender}
                    items={genderItems}
                    setOpen={() => handleDropdownOpen("gender")}
                    setValue={(callback) => {
                      const val =
                        typeof callback === "function"
                          ? callback(editingGender)
                          : callback;
                      setEditingGender(val ?? "");
                    }}
                    setItems={emptyCallback}
                    listMode="SCROLLVIEW"
                    disabled={isSaving}
                    style={[
                      styles.dropdown,
                      editingGender && { borderColor: SECONDARY, borderWidth: 2 },
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      { maxHeight: screenHeight * 0.35 },
                    ]}
                  />
                </View>

                {/* Pronouns Dropdown */}
                <View style={[profileStyles.formField, { zIndex: getZIndex("pronouns", 1) }]}>
                  <Text style={profileStyles.formLabel}>Pronouns</Text>
                  <DropDownPicker<string>
                    placeholder="Select your pronouns"
                    open={activeDropdown === "pronouns"}
                    value={editingPronouns}
                    items={pronounsItems}
                    setOpen={() => handleDropdownOpen("pronouns")}
                    setValue={(callback) => {
                      const val =
                        typeof callback === "function"
                          ? callback(editingPronouns)
                          : callback;
                      setEditingPronouns(val ?? "");
                    }}
                    setItems={emptyCallback}
                    listMode="SCROLLVIEW"
                    disabled={isSaving}
                    style={[
                      styles.dropdown,
                      editingPronouns && { borderColor: SECONDARY, borderWidth: 2 },
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      { maxHeight: screenHeight * 0.35 },
                    ]}
                    dropDownDirection="TOP"
                  />
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
                onPress={handleCloseEditModal}
                disabled={isSaving}
              >
                <Text style={profileStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  profileStyles.modalSaveButton,
                  isSaving && { opacity: 0.5 },
                ]}
                onPress={handleSaveUserInfo}
                disabled={isSaving}
              >
                <Text style={profileStyles.modalSaveText}>
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={
                editingBirthdate
                  ? new Date(editingBirthdate)
                  : maxBirthdate
              }
              maximumDate={maxBirthdate}
              onConfirm={handleDateConfirm}
              onCancel={() => setShowDatePicker(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  universityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  universityText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoPadding: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  dropdown: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 0,
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    color: "#ef4444",
    marginTop: 6,
    fontSize: 13,
    textAlign: "left",
    fontWeight: "500",
  },
});
