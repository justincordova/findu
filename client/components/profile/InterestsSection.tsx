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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ItemType } from "react-native-dropdown-picker";

// Project imports
import { profileStyles } from "./shared/profileStyles";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/store/authStore";
import { useConstantsStore } from "@/store/constantsStore";
import { profileApi } from "@/api/profile";
import SearchableModal from "@/components/shared/SearchableModal";
import logger from "@/config/logger";
import { DARK, MUTED, PRIMARY, GRADIENT } from "@/constants/theme";

/**
 * InterestsSection Component
 *
 * Displays user's interests with tap-to-edit functionality.
 * Uses pill-style display matching Step7 profile setup pattern.
 * Allows adding/removing interests with max 10 limit.
 *
 * Features:
 * - Popular interests display as selectable pills
 * - Categorized interest browser
 * - Custom interest input
 * - SearchableModal for quick selection
 * - Comprehensive logging and error handling
 */

// Unbiased popular interests
const POPULAR_INTERESTS_UNBIASED = [
  "Travel",
  "Music",
  "Fitness",
  "Cooking",
  "Reading",
  "Art",
  "Movies",
  "Hiking",
  "Photography",
  "Gaming",
  "Yoga",
  "Socializing",
];


export default function InterestsSection() {
  const { profile, refetch, isEditable = true } = useProfile();
  const userId = useAuthStore((state) => state.userId);
  const constants = useConstantsStore((state) => state.constants);

  // Display data
  const interests = useMemo(
    () => (Array.isArray(profile?.interests) ? profile.interests : []),
    [profile?.interests]
  );

  // Organized interests from constants
  const organizedInterests = useMemo(() => {
    if (!constants?.interests) return {};
    return constants.interests as Record<string, string[]>;
  }, [constants?.interests]);

  // Flat list of all interests for SearchableModal
  const allInterestsFlat = useMemo(() => {
    const allInterests: ItemType<string>[] = [];
    Object.values(organizedInterests).forEach((interestList) => {
      interestList.forEach((interest) => {
        if (!allInterests.find((item) => item.value === interest)) {
          allInterests.push({ label: interest, value: interest });
        }
      });
    });
    return allInterests.sort((a, b) =>
      (a.label || "").localeCompare(b.label || "")
    );
  }, [organizedInterests]);

  // Modal and editing state
  const [modalVisible, setModalVisible] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [editingInterests, setEditingInterests] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);


  // Check if interest is selected
  const isInterestSelected = useCallback(
    (interest: string) => editingInterests.includes(interest),
    [editingInterests]
  );

  // Add interest
  const addInterest = useCallback(
    (interest: string) => {
      const trimmed = interest.trim();
      if (!trimmed) {
        setCustomInput("");
        return;
      }
      if (editingInterests.includes(trimmed)) {
        Alert.alert("Info", "This interest is already added");
        setCustomInput("");
        return;
      }
      if (editingInterests.length >= 10) {
        Alert.alert("Interest Limit", "You can only add up to 10 interests");
        setCustomInput("");
        return;
      }
      setEditingInterests([...editingInterests, trimmed]);
      logger.debug("Interest added", { interest: trimmed });
      setCustomInput("");
    },
    [editingInterests]
  );

  // Remove interest
  const removeInterest = useCallback((interest: string) => {
    setEditingInterests((prev) => prev.filter((i) => i !== interest));
    logger.debug("Interest removed", { interest });
  }, []);

  // Open modal
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening interests edit modal", {
      userId,
      currentCount: interests.length,
    });
    setEditingInterests([...interests]);
    setCustomInput("");
    setModalVisible(true);
  }, [interests, userId]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setShowCategoriesDropdown(false);
  }, []);

  // Save interests
  const handleSaveInterests = useCallback(async () => {
    if (!userId) {
      logger.error("[InterestsSection] User ID not found");
      Alert.alert("Error", "You must be logged in");
      return;
    }

    try {
      setIsSaving(true);
      // Deduplicate interests before saving
      const dedupedInterests = Array.from(new Set(editingInterests));

      logger.debug("Saving interests", {
        userId,
        newCount: dedupedInterests.length,
      });

      await profileApi.update(userId, { interests: dedupedInterests });

      logger.info("Interests updated successfully", {
        userId,
        interestCount: dedupedInterests.length,
      });

      await refetch();
      handleCloseModal();
      Alert.alert("Success", "Interests updated!");
    } catch (error) {
      logger.error("Failed to update interests", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert("Error", "Failed to update interests. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, editingInterests, refetch, handleCloseModal]);

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
          <Text style={profileStyles.cardTitle}>Interests</Text>
        </View>

        {/* Display Interests as Badges */}
        {interests.length > 0 ? (
          <View style={styles.badgesContainer}>
            {interests.map((interest) => (
              <LinearGradient
                key={interest}
                colors={GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>{interest}</Text>
              </LinearGradient>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No interests added yet</Text>
        )}
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
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
              <Text style={profileStyles.modalTitle}>Edit Interests</Text>
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
              {/* SearchableModal for all interests */}
              <SearchableModal
                label="Search All Interests"
                value={editingInterests}
                items={allInterestsFlat}
                onValueChange={(values) => {
                  const interestArray = Array.isArray(values) ? values : [values];

                  // Handle "All" selection logic
                  if (interestArray.includes("All")) {
                    // If "All" is selected, only keep "All"
                    setEditingInterests(["All"]);
                  } else if (editingInterests.includes("All") && interestArray.length === 0) {
                    // If user deselects "All", clear interests
                    setEditingInterests([]);
// sourcery skip: merge-else-if
                  } else if (editingInterests.includes("All")) {
                    // If "All" was previously selected and user tries to select something else, reject it
                    Alert.alert("Info", "Deselect 'All' to choose specific interests");
                  } else {
                    // Normal multi-select behavior
                    if (interestArray.length <= 10) {
                      setEditingInterests(interestArray);
                    } else {
                      Alert.alert("Error", "Maximum 10 interests allowed");
                    }
                  }
                }}
                open={showCategoriesDropdown}
                onOpenChange={() =>
                  setShowCategoriesDropdown(!showCategoriesDropdown)
                }
                placeholder="Search interests..."
                searchPlaceholder="Search interests..."
                noResultsText="No interests found"
                showCompleted={false}
                zIndex={10}
                multiSelect={true}
              />

              {/* Popular Interests */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Popular</Text>
                <View style={styles.pillContainer}>
                  {POPULAR_INTERESTS_UNBIASED.map((interest) => (
                    <TouchableOpacity
                      key={interest}
                      onPress={() =>
                        isInterestSelected(interest)
                          ? removeInterest(interest)
                          : addInterest(interest)
                      }
                      style={[
                        styles.pill,
                        isInterestSelected(interest) && styles.pillSelected,
                      ]}
                      disabled={
                        !isInterestSelected(interest) &&
                        editingInterests.length >= 10
                      }
                    >
                      <Text
                        style={[
                          styles.pillText,
                          isInterestSelected(interest) &&
                            styles.pillTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Interest Input */}
              <View style={styles.customInputContainer}>
                <Text style={styles.sectionTitle}>Add Custom</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      customInput && { borderColor: PRIMARY, borderWidth: 2 },
                    ]}
                    placeholder="Type an interest..."
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholderTextColor={MUTED}
                    onSubmitEditing={() => addInterest(customInput)}
                    editable={!isSaving && editingInterests.length < 10}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (isSaving || editingInterests.length >= 10) && {
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => addInterest(customInput)}
                    disabled={isSaving || editingInterests.length >= 10}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selected Interests */}
              {editingInterests.length > 0 && (
                <View style={styles.selectedContainer}>
                  <Text style={styles.sectionTitle}>
                    Selected ({editingInterests.length}/10)
                  </Text>
                  <View style={styles.selectedBadgesContainer}>
                    {editingInterests.map((interest) => (
                      <LinearGradient
                        key={interest}
                        colors={GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.selectedBadge}
                      >
                        <Text style={styles.selectedBadgeText}>
                          {interest}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeInterest(interest)}
                          disabled={isSaving}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={isSaving ? "#ccc" : "white"}
                          />
                        </TouchableOpacity>
                      </LinearGradient>
                    ))}
                  </View>
                </View>
              )}
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
                onPress={handleSaveInterests}
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

  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  badgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyText: {
    fontSize: 14,
    color: MUTED,
    fontStyle: "italic",
  },

  sectionContainer: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },

  pillSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  pillText: {
    fontSize: 14,
    color: DARK,
    fontWeight: "500",
  },

  pillTextSelected: {
    color: "white",
    fontWeight: "600",
  },

  customInputContainer: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
  },

  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK,
    backgroundColor: "white",
  },

  addButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  selectedContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  selectedBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  selectedBadgeText: {
    marginRight: 8,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
