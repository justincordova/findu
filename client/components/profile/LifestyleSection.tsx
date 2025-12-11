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

// Project imports
import { profileStyles } from "./shared/profileStyles";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { useConstantsStore } from "@/store/constantsStore";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";
import { PRIMARY } from "@/constants/theme";
import { Lifestyle } from "@/types/Lifestyle";

/**
 * LifestyleSection Component
 *
 * Displays and manages user lifestyle preferences:
 * - 9 single-select fields (drinking, smoking, cannabis, sleep_habits, study_style, cleanliness, caffeine, living_situation, fitness)
 * - 2 multi-select fields (pets, dietary_preferences)
 *
 * Features:
 * - Dropdown modal for single-select fields
 * - Multi-select buttons for array fields
 * - Only shows fields that have been filled
 * - Comprehensive logging and error handling
 */
export default function LifestyleSection() {
  const { profile, refetch } = useProfile();
  const userId = useAuthStore((state) => state.userId);
  const { constants } = useConstantsStore();

  // Display lifestyle data
  const lifestyle = useMemo(
    () => (profile?.lifestyle as Lifestyle | undefined) || {},
    [profile?.lifestyle]
  );

  // Modal and dropdown state
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [activeDropdowns, setActiveDropdowns] = useState<Record<string, boolean>>({});
  const [editingLifestyle, setEditingLifestyle] = useState<Lifestyle>({});
  const [isSaving, setIsSaving] = useState(false);

  // Field metadata for all 11 lifestyle fields
  const lifestyleFields = useMemo(
    () => [
      { key: "drinking" as const, label: "Drinking", type: "single" },
      { key: "smoking" as const, label: "Smoking", type: "single" },
      { key: "cannabis" as const, label: "Cannabis", type: "single" },
      { key: "sleep_habits" as const, label: "Sleep Habits", type: "single" },
      { key: "pets" as const, label: "Pets", type: "multi" },
      {
        key: "dietary_preferences" as const,
        label: "Dietary Preferences",
        type: "multi",
      },
      { key: "study_style" as const, label: "Study Style", type: "single" },
      { key: "cleanliness" as const, label: "Cleanliness", type: "single" },
      { key: "caffeine" as const, label: "Caffeine", type: "single" },
      {
        key: "living_situation" as const,
        label: "Living Situation",
        type: "single",
      },
      { key: "fitness" as const, label: "Fitness", type: "single" },
    ],
    []
  );

  // Get options for a field from constants
  const getFieldOptions = useCallback(
    (field: keyof Lifestyle) => {
      const fieldToConstant: Record<string, string> = {
        drinking: "drinking",
        smoking: "smoking",
        cannabis: "cannabis",
        sleep_habits: "sleepHabits",
        pets: "pets",
        dietary_preferences: "dietaryPreferences",
        study_style: "studyStyle",
        cleanliness: "cleanliness",
        caffeine: "caffeine",
        living_situation: "livingSituation",
        fitness: "fitness",
      };

      const constantKey = fieldToConstant[field];
      if (!constantKey || !constants?.lifestyleOptions) return [];
      return ((constants.lifestyleOptions as Record<string, readonly string[]>)[constantKey] as string[]) || [];
    },
    [constants]
  );

  // Open modal and initialize editing state
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening Lifestyle edit modal", { userId });
    setEditingLifestyle(lifestyle || {});
    setMainModalVisible(true);
  }, [lifestyle, userId]);

  const handleCloseModal = useCallback(() => {
    setMainModalVisible(false);
    setActiveDropdowns({});
  }, []);

  // Toggle dropdown visibility
  const toggleDropdown = useCallback((field: keyof Lifestyle) => {
    setActiveDropdowns((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  // Handle single-select field change
  const handleSelectField = useCallback((field: keyof Lifestyle, value: string) => {
    setEditingLifestyle((prev) => ({
      ...prev,
      [field]: value.length > 0 ? value : undefined,
    }));
    setActiveDropdowns((prev) => ({ ...prev, [field]: false }));
  }, []);

  // Handle multi-select field change
  const handleToggleMultiField = useCallback(
    (field: keyof Lifestyle, value: string) => {
      setEditingLifestyle((prev) => {
        // Clear all selections if empty string passed
        if (value === "") {
          return { ...prev, [field]: undefined };
        }
        const current = (prev[field] as string[]) || [];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return {
          ...prev,
          [field]: updated.length > 0 ? updated : undefined,
        };
      });
    },
    []
  );

  /**
   * Save lifestyle to profile
   */
  const handleSaveLifestyle = useCallback(async () => {
    if (!userId) {
      logger.error("[LifestyleSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    try {
      setIsSaving(true);
      logger.debug("Saving lifestyle", { userId, lifestyle: editingLifestyle });

      await profileApi.update(userId, {
        lifestyle: Object.keys(editingLifestyle).length > 0 ? editingLifestyle : null,
      });

      logger.info("Lifestyle updated successfully", {
        userId,
        lifestyle: editingLifestyle,
      });

      // Refetch to sync with server
      await refetch();

      handleCloseModal();
      Alert.alert("Success", "Lifestyle updated!");
    } catch (error) {
      logger.error("Failed to update Lifestyle", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update lifestyle. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, editingLifestyle, refetch, handleCloseModal]);

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <TouchableOpacity
        style={profileStyles.card}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <View style={[profileStyles.cardHeader, { gap: 10 }]}>
          <Ionicons name="sparkles-outline" size={24} color={PRIMARY} />
          <Text style={profileStyles.cardTitle}>Lifestyle</Text>
        </View>

        {/* Info Grid - Display only filled fields, or N/A if none */}
        <View style={profileStyles.infoGrid}>
          {lifestyleFields.filter((field) => lifestyle[field.key] !== undefined).length > 0 ? (
            lifestyleFields
              .filter((field) => lifestyle[field.key] !== undefined)
              .map((field) => {
                const value = lifestyle[field.key];
                const displayValue = Array.isArray(value)
                  ? value.join(", ")
                  : String(value);

                return (
                  <View key={field.key} style={profileStyles.infoItem}>
                    <Ionicons name="ellipsis-horizontal-outline" size={20} color={PRIMARY} style={{ opacity: 1 }} />
                    <View style={profileStyles.infoTextContainer}>
                      <Text style={profileStyles.infoLabel}>{field.label}</Text>
                      <Text style={profileStyles.infoValue}>{displayValue}</Text>
                    </View>
                  </View>
                );
              })
          ) : (
            <View style={profileStyles.infoItem}>
              <Ionicons name="ellipsis-horizontal-outline" size={20} color={PRIMARY} style={{ opacity: 1 }} />
              <View style={profileStyles.infoTextContainer}>
                <Text style={profileStyles.infoLabel}>Lifestyle</Text>
                <Text style={[profileStyles.infoValue, { color: "#999" }]}>N/A</Text>
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
              <Text style={profileStyles.modalTitle}>Edit Lifestyle</Text>
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
                {lifestyleFields.map((fieldConfig) => {
                  const options = getFieldOptions(fieldConfig.key);
                  if (options.length === 0) return null;

                  const currentValue = editingLifestyle[fieldConfig.key];
                  const isMultiSelect = fieldConfig.type === "multi";
                  const displayValue = isMultiSelect
                    ? Array.isArray(currentValue)
                      ? currentValue.join(", ")
                      : "Select..."
                    : (currentValue as string) || "Select...";

                  return (
                    <View key={fieldConfig.key} style={profileStyles.formField}>
                      <Text style={profileStyles.formLabel}>{fieldConfig.label}</Text>

                      {/* Unified dropdown for all field types */}
                      <TouchableOpacity
                        style={[
                          profileStyles.dropdownButton,
                          currentValue && profileStyles.formInputFilled,
                        ]}
                        onPress={() => toggleDropdown(fieldConfig.key)}
                        disabled={isSaving}
                      >
                        <Text style={profileStyles.dropdownText}>
                          {displayValue}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>

                      {/* Inline Dropdown */}
                      {activeDropdowns[fieldConfig.key] && (
                        <View
                          style={[
                            profileStyles.dropdownModalContent,
                            { marginTop: 4, zIndex: 1000 },
                          ]}
                        >
                          {/* Options */}
                          {options.map((option) => {
                            const isSelected = isMultiSelect
                              ? Array.isArray(currentValue) &&
                                currentValue.includes(option)
                              : currentValue === option;

                            return (
                              <TouchableOpacity
                                key={option}
                                style={profileStyles.dropdownOption}
                                onPress={() => {
                                  if (isMultiSelect) {
                                    handleToggleMultiField(fieldConfig.key, option);
                                  } else {
                                    // For single-select: click again to deselect
                                    if (isSelected) {
                                      handleSelectField(fieldConfig.key, "");
                                    } else {
                                      handleSelectField(fieldConfig.key, option);
                                    }
                                    setActiveDropdowns((prev) => ({
                                      ...prev,
                                      [fieldConfig.key]: false,
                                    }));
                                  }
                                }}
                              >
                                <Text
                                  style={[
                                    profileStyles.dropdownOptionText,
                                    isSelected && {
                                      fontWeight: "600",
                                      color: PRIMARY,
                                    },
                                  ]}
                                >
                                  {option}
                                </Text>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={20}
                                    color={PRIMARY}
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
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
                onPress={handleSaveLifestyle}
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
});
