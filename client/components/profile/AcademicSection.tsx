// React core

// Third-party
import { Ionicons } from "@expo/vector-icons";
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
import type { ItemType } from "react-native-dropdown-picker";
import { profileApi } from "@/api/profile";
import SearchableModal from "@/components/shared/SearchableModal";
import logger from "@/config/logger";
import { PRIMARY } from "@/constants/theme";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { useConstantsStore } from "@/store/constantsStore";
// Project imports
import { profileStyles } from "./shared/profileStyles";

/**
 * AcademicSection Component
 *
 * Displays and manages user's academic information:
 * - Major (from constants store)
 * - University year (Freshman, Sophomore, Junior, Senior, Graduate)
 * - Graduation year (numeric)
 *
 * Features:
 * - Searchable dropdown for major (from constants store)
 * - Dropdown for university year
 * - Numeric input for graduation year
 * - Comprehensive logging and error handling
 */
export default function AcademicSection() {
  const { profile, refetch, isEditable = true } = useProfile();
  const userId = useAuthStore((state) => state.userId);
  const { constants } = useConstantsStore();

  // Display data
  const major = profile?.major || "";
  const universityYear = profile?.university_year || null;
  const gradYear = profile?.grad_year || null;

  // Year mapping for display (fixed values)
  const YEAR_MAP: Record<number, string> = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
    5: "Graduate",
  };

  // Major options from constants store
  const majorItems: ItemType<string>[] = useMemo(() => {
    return (constants?.majors ?? []).map((majorName) => ({
      label: majorName,
      value: majorName,
    }));
  }, [constants?.majors]);

  // Year options (fixed, not from constants)
  const yearOptions = [
    { label: "Freshman", value: 1 },
    { label: "Sophomore", value: 2 },
    { label: "Junior", value: 3 },
    { label: "Senior", value: 4 },
    { label: "Graduate", value: 5 },
  ];

  // Graduation year dropdown options (next 50 years)
  const gradYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: { label: string; value: number }[] = [];
    for (let i = currentYear; i <= currentYear + 50; i++) {
      years.push({ label: String(i), value: i });
    }
    return years;
  }, []);

  // Modal state
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [activeYearDropdown, setActiveYearDropdown] = useState(false);
  const [activeGradYearDropdown, setActiveGradYearDropdown] = useState(false);
  const [activeMajorDropdown, setActiveMajorDropdown] = useState(false);

  // Editing state
  const [editingMajor, setEditingMajor] = useState(major);
  const [editingYear, setEditingYear] = useState(universityYear);
  const [editingGradYear, setEditingGradYear] = useState<number | null>(
    gradYear,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Open main edit modal
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening academic info edit modal", {
      userId,
      currentYear: universityYear,
      currentMajor: major,
    });
    setEditingMajor(major);
    setEditingYear(universityYear);
    setEditingGradYear(gradYear);
    setMainModalVisible(true);
  }, [major, universityYear, gradYear, userId]);

  const handleCloseModal = useCallback(() => {
    setMainModalVisible(false);
    setActiveMajorDropdown(false);
    setActiveYearDropdown(false);
    setActiveGradYearDropdown(false);
  }, []);

  /**
   * Save academic information to profile
   */
  const handleSaveAcademic = useCallback(async () => {
    if (!userId) {
      logger.error("[AcademicSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    // Validate inputs
    if (!editingMajor?.trim()) {
      Alert.alert("Error", "Please select a major");
      return;
    }

    if (!editingYear) {
      Alert.alert("Error", "Please select a year");
      return;
    }

    if (!editingGradYear) {
      Alert.alert("Error", "Please select a graduation year");
      return;
    }

    try {
      setIsSaving(true);
      logger.debug("Saving academic info", {
        userId,
        major: editingMajor,
        year: editingYear,
        gradYear: editingGradYear,
      });

      await profileApi.update(userId, {
        major: editingMajor.trim(),
        university_year: editingYear,
        grad_year: editingGradYear,
      });

      logger.info("Academic info updated successfully", {
        userId,
        major: editingMajor,
        year: editingYear,
        gradYear: editingGradYear,
      });

      // Refetch to sync with server
      await refetch();

      handleCloseModal();
      Alert.alert("Success", "Academic info updated!");
    } catch (error) {
      logger.error("Failed to update academic info", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update academic info. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    userId,
    editingMajor,
    editingYear,
    editingGradYear,
    refetch,
    handleCloseModal,
  ]);

  const getYearText = (): string => {
    if (universityYear == null) return "Not set";
    return YEAR_MAP[universityYear] || "Unknown";
  };

  const getGradYearText = (): string => {
    if (gradYear == null) return "Not set";
    return String(gradYear);
  };

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
          <Ionicons name="school-outline" size={24} color={PRIMARY} />
          <Text style={profileStyles.cardTitle}>Academic Info</Text>
        </View>

        {/* Info Grid */}
        <View style={profileStyles.infoGrid}>
          {major && (
            <View style={profileStyles.infoItem}>
              <Ionicons name="book-outline" size={20} color={PRIMARY} />
              <View style={profileStyles.infoTextContainer}>
                <Text style={profileStyles.infoLabel}>Major</Text>
                <Text style={profileStyles.infoValue}>{major}</Text>
              </View>
            </View>
          )}

          {universityYear && (
            <View style={profileStyles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
              <View style={profileStyles.infoTextContainer}>
                <Text style={profileStyles.infoLabel}>Year</Text>
                <Text style={profileStyles.infoValue}>{getYearText()}</Text>
              </View>
            </View>
          )}

          {gradYear && (
            <View style={profileStyles.infoItem}>
              <Ionicons name="flag-outline" size={20} color={PRIMARY} />
              <View style={profileStyles.infoTextContainer}>
                <Text style={profileStyles.infoLabel}>Graduating</Text>
                <Text style={profileStyles.infoValue}>{getGradYearText()}</Text>
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
              <Text style={profileStyles.modalTitle}>Edit Academic Info</Text>
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
                {/* Major - SearchableModal */}
                <SearchableModal
                  label="Major"
                  value={editingMajor}
                  items={majorItems}
                  onValueChange={(value) =>
                    setEditingMajor(Array.isArray(value) ? value[0] : value)
                  }
                  open={activeMajorDropdown}
                  onOpenChange={() =>
                    setActiveMajorDropdown(!activeMajorDropdown)
                  }
                  placeholder="Select your major..."
                  searchPlaceholder="Search majors..."
                  noResultsText="No majors found"
                  showCompleted={true}
                  zIndex={10}
                />

                {/* Year Dropdown */}
                <View style={[profileStyles.formField, { marginTop: -20 }]}>
                  <Text style={profileStyles.formLabel}>Year</Text>
                  <TouchableOpacity
                    style={[
                      profileStyles.dropdownButton,
                      editingYear ? profileStyles.formInputFilled : null,
                    ]}
                    onPress={() => setActiveYearDropdown(!activeYearDropdown)}
                    disabled={isSaving}
                  >
                    <Text style={profileStyles.dropdownText}>
                      {editingYear ? YEAR_MAP[editingYear] : "Select year"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {/* Inline Year Dropdown */}
                  {activeYearDropdown && (
                    <View
                      style={[
                        profileStyles.dropdownModalContent,
                        { marginTop: 4, maxHeight: 250 },
                      ]}
                    >
                      {yearOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={profileStyles.dropdownOption}
                          onPress={() => {
                            setEditingYear(option.value);
                            setActiveYearDropdown(false);
                          }}
                        >
                          <Text style={profileStyles.dropdownOptionText}>
                            {option.label}
                          </Text>
                          {editingYear === option.value && (
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

                {/* Graduation Year Dropdown */}
                <View style={profileStyles.formField}>
                  <Text style={profileStyles.formLabel}>Graduation Year</Text>
                  <TouchableOpacity
                    style={[
                      profileStyles.dropdownButton,
                      editingGradYear ? profileStyles.formInputFilled : null,
                    ]}
                    onPress={() =>
                      setActiveGradYearDropdown(!activeGradYearDropdown)
                    }
                    disabled={isSaving}
                  >
                    <Text style={profileStyles.dropdownText}>
                      {editingGradYear
                        ? String(editingGradYear)
                        : "Select year"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {/* Inline Graduation Year Dropdown */}
                  {activeGradYearDropdown && (
                    <View
                      style={[
                        profileStyles.dropdownModalContent,
                        { marginTop: 4, maxHeight: 250 },
                      ]}
                    >
                      {gradYearOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={profileStyles.dropdownOption}
                          onPress={() => {
                            setEditingGradYear(option.value);
                            setActiveGradYearDropdown(false);
                          }}
                        >
                          <Text style={profileStyles.dropdownOptionText}>
                            {option.label}
                          </Text>
                          {editingGradYear === option.value && (
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
                onPress={handleSaveAcademic}
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
