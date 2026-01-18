// React core
import { useCallback, useMemo, useState } from "react";

// React Native
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Project imports
import { profileStyles } from "./shared/profileStyles";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { useConstantsStore } from "@/store/constantsStore";
import { profileApi } from "@/api/profile";
import AgeRangeStepper from "@/components/shared/AgeRangeStepper";
import logger from "@/config/logger";
import { PRIMARY, GRADIENT } from "@/constants/theme";

/**
 * PreferencesSection Component
 *
 * Displays and manages user preferences:
 * - Sexual orientation (from constants store)
 * - Looking for (intent, from constants store)
 * - Age range
 * - Interested in (gender preferences, from constants store)
 *
 * Features:
 * - Dropdown modal for single-select fields
 * - Multi-select buttons for gender preferences
 * - Age range stepper for min/max age
 * - Comprehensive logging and error handling
 */
export default function PreferencesSection() {
  const { profile, refetch, isEditable = true } = useProfile();
  const userId = useAuthStore((state) => state.userId);
  const { constants } = useConstantsStore();

  // Display data
  const sexualOrientation = profile?.sexual_orientation || "";
  const intent = profile?.intent || "";
  const ageRange = useMemo(
    () => ({
      min_age: profile?.min_age || 18,
      max_age: profile?.max_age || 26,
    }),
    [profile?.min_age, profile?.max_age]
  );
  const genderPreferences = useMemo(
    () =>
      Array.isArray(profile?.gender_preference)
        ? profile.gender_preference
        : [],
    [profile?.gender_preference]
  );

  // Dropdown options from constants store
  const sexualOrientationOptions = (constants?.sexualOrientations || []).map(
    (value) => ({
      label: value.charAt(0).toUpperCase() + value.slice(1),
      value,
    })
  );

  const intentOptions = (constants?.intents || []).map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    value,
  }));

  const genderPreferenceOptions = constants?.genderPreferences || [];

  // Modal state
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [activeOrientationDropdown, setActiveOrientationDropdown] = useState(false);
  const [activeIntentDropdown, setActiveIntentDropdown] = useState(false);

  // Editing state
  const [editingSexualOrientation, setEditingSexualOrientation] = useState(
    sexualOrientation
  );
  const [editingIntent, setEditingIntent] = useState(intent);
  const [editingAgeRange, setEditingAgeRange] = useState(ageRange);
  const [editingGenderPreference, setEditingGenderPreference] = useState(
    genderPreferences
  );
  const [isSaving, setIsSaving] = useState(false);

  // Open main edit modal
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening Preferences edit modal", { userId });
    setEditingSexualOrientation(sexualOrientation);
    setEditingIntent(intent);
    setEditingAgeRange(ageRange);
    setEditingGenderPreference(genderPreferences);
    setMainModalVisible(true);
  }, [sexualOrientation, intent, ageRange, genderPreferences, userId]);

  const handleCloseModal = useCallback(() => {
    setMainModalVisible(false);
    setActiveOrientationDropdown(false);
    setActiveIntentDropdown(false);
  }, []);

  // Toggle gender preference with "All" logic
  const toggleGenderPreference = useCallback((gender: string) => {
    setEditingGenderPreference((prev: string[]) => {
      // If selecting "All", clear other selections
      if (gender === "All") {
        return prev.includes("All") ? [] : ["All"];
      }

      // If "All" is selected and user tries to select something else, reject it
      if (prev.includes("All")) {
        Alert.alert("Info", "Deselect 'All' to choose specific genders");
        return prev;
      }

      // Normal multi-select behavior
      if (prev.includes(gender)) {
        return prev.filter((g: string) => g !== gender);
      } else {
        return [...prev, gender];
      }
    });
  }, []);

  // Handle age range change
  const handleAgeRangeChange = useCallback(
    (minAge: number, maxAge: number) => {
      setEditingAgeRange({ min_age: minAge, max_age: maxAge });
    },
    []
  );

  /**
   * Save preferences to profile
   */
  const handleSavePreferences = useCallback(async () => {
    if (!userId) {
      logger.error("[PreferencesSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    try {
      setIsSaving(true);
      logger.debug("Saving preferences", {
        userId,
        sexual_orientation: editingSexualOrientation,
        intent: editingIntent,
        age_range: editingAgeRange,
        gender_preferences: editingGenderPreference,
      });

      await profileApi.update(userId, {
        sexual_orientation: editingSexualOrientation,
        intent: editingIntent,
        min_age: editingAgeRange.min_age,
        max_age: editingAgeRange.max_age,
        gender_preference: editingGenderPreference,
      });

      logger.info("Preferences updated successfully", {
        userId,
        sexual_orientation: editingSexualOrientation,
        intent: editingIntent,
        ageRange: editingAgeRange,
        genderPreferences: editingGenderPreference,
      });

      // Refetch to sync with server
      await refetch();

      handleCloseModal();
      Alert.alert("Success", "Preferences updated!");
    } catch (error) {
      logger.error("Failed to update Preferences", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, editingSexualOrientation, editingIntent, editingAgeRange, editingGenderPreference, refetch, handleCloseModal]);

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <TouchableOpacity
        style={profileStyles.card}
        onPress={handleOpenModal}
        activeOpacity={0.7}
        disabled={!isEditable}
      >
        <View style={[profileStyles.cardHeader, { gap: 10 }]}>
          <Ionicons name="heart-outline" size={24} color={PRIMARY} />
          <Text style={profileStyles.cardTitle}>Preferences</Text>
        </View>

        {/* Info Grid */}
        <View style={profileStyles.infoGrid}>
          {/* Sexual Orientation */}
          <View style={profileStyles.infoItem}>
            <Ionicons name="heart-outline" size={20} color={PRIMARY} />
            <View style={profileStyles.infoTextContainer}>
              <Text style={profileStyles.infoLabel}>Sexual Orientation</Text>
              <Text style={profileStyles.infoValue}>
                {sexualOrientation || "Not specified"}
              </Text>
            </View>
          </View>

          {/* Looking For (Intent) */}
          <View style={profileStyles.infoItem}>
            <Ionicons name="compass-outline" size={20} color={PRIMARY} />
            <View style={profileStyles.infoTextContainer}>
              <Text style={profileStyles.infoLabel}>Looking For</Text>
              <Text style={profileStyles.infoValue}>
                {intent ? intent.charAt(0).toUpperCase() + intent.slice(1) : "Not specified"}
              </Text>
            </View>
          </View>

          {/* Age Range */}
          <View style={profileStyles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
            <View style={profileStyles.infoTextContainer}>
              <Text style={profileStyles.infoLabel}>Preferred Age</Text>
              <Text style={profileStyles.infoValue}>
                {ageRange.min_age} - {ageRange.max_age}
              </Text>
            </View>
          </View>

          {/* Interested In */}
          {genderPreferences.length > 0 && (
            <View style={profileStyles.infoItem}>
              <Ionicons name="people-outline" size={20} color={PRIMARY} />
              <View style={profileStyles.infoTextContainer}>
                <Text style={profileStyles.infoLabel}>Interested In</Text>
                <View style={styles.genderPreferenceBadges}>
                  {genderPreferences.map((gender: string, idx: number) => (
                    <LinearGradient
                      key={idx}
                      colors={GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={profileStyles.interestBadge}
                    >
                      <Text style={[profileStyles.interestText, { color: "white" }]}>{gender}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
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
              <Text style={profileStyles.modalTitle}>Edit Preferences</Text>
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
                {/* Sexual Orientation Dropdown */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>
                    Sexual Orientation
                  </Text>
                  <TouchableOpacity
                    style={[
                      profileStyles.dropdownButton,
                      editingSexualOrientation && profileStyles.formInputFilled,
                    ]}
                    onPress={() =>
                      setActiveOrientationDropdown(!activeOrientationDropdown)
                    }
                    disabled={isSaving}
                  >
                    <Text style={profileStyles.dropdownText}>
                      {editingSexualOrientation || "Select sexual orientation"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {/* Inline Sexual Orientation Dropdown */}
                  {activeOrientationDropdown && (
                    <View style={[profileStyles.dropdownModalContent, { marginTop: 4, zIndex: 1000 }]}>
                      {sexualOrientationOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={profileStyles.dropdownOption}
                          onPress={() => {
                            setEditingSexualOrientation(option.value);
                            setActiveOrientationDropdown(false);
                          }}
                        >
                          <Text style={profileStyles.dropdownOptionText}>
                            {option.label}
                          </Text>
                          {editingSexualOrientation === option.value && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={PRIMARY}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Intent Dropdown */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Looking For</Text>
                  <TouchableOpacity
                    style={[
                      profileStyles.dropdownButton,
                      editingIntent && profileStyles.formInputFilled,
                    ]}
                    onPress={() =>
                      setActiveIntentDropdown(!activeIntentDropdown)
                    }
                    disabled={isSaving}
                  >
                    <Text style={profileStyles.dropdownText}>
                      {editingIntent
                        ? editingIntent.charAt(0).toUpperCase() +
                          editingIntent.slice(1)
                        : "Select looking for"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {/* Inline Intent Dropdown */}
                  {activeIntentDropdown && (
                    <View style={[profileStyles.dropdownModalContent, { marginTop: 4, zIndex: 1000 }]}>
                      {intentOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={profileStyles.dropdownOption}
                          onPress={() => {
                            setEditingIntent(option.value);
                            setActiveIntentDropdown(false);
                          }}
                        >
                          <Text style={profileStyles.dropdownOptionText}>
                            {option.label}
                          </Text>
                          {editingIntent === option.value && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={PRIMARY}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Preferred Ages Stepper */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Preferred Ages</Text>
                  <AgeRangeStepper
                    minAge={editingAgeRange.min_age}
                    maxAge={editingAgeRange.max_age}
                    onAgeRangeChange={handleAgeRangeChange}
                    minLimit={18}
                    maxLimit={26}
                  />
                </View>

                {/* Gender Preference Multi-Select */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>
                    Interested In (select all that apply)
                  </Text>
                  <View style={profileStyles.intentOptionsContainer}>
                    {genderPreferenceOptions.map((option) => {
                      const isSelected = editingGenderPreference.includes(option);
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            profileStyles.intentOption,
                            isSelected && profileStyles.intentOptionSelected,
                          ]}
                          onPress={() => toggleGenderPreference(option)}
                          disabled={isSaving}
                        >
                          <Text
                            style={[
                              profileStyles.intentOptionText,
                              isSelected && profileStyles.intentOptionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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
                onPress={handleSavePreferences}
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

  genderPreferenceBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
});
