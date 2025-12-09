// React core
import { useCallback, useEffect, useMemo, useState } from "react";

// React Native
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";
import { ItemType } from "react-native-dropdown-picker";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY, SECONDARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useConstantsStore } from "@/store/constantsStore";
import SearchableModal from "@/components/shared/SearchableModal";

// Types
interface Step7Props {
  onValidityChange?: (isValid: boolean) => void;
}

interface ExpandedCategories {
  [key: string]: boolean;
}

// UNBIASED popular interests - diverse across categories
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

/**
 * Step 7: Interests - select from categories or add custom interests
 * Features:
 * - Unbiased popular interests selection
 * - Paginated category browsing to avoid overwhelming lists
 * - Custom interest input
 * - Real-time interest organization from backend constants
 */
export default function Step7({ onValidityChange }: Step7Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore(
    (state) => state.setProfileField
  );
  const constants = useConstantsStore((state) => state.constants);

  const [interestInput, setInterestInput] = useState("");
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] =
    useState<ExpandedCategories>({});
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>(
    {}
  );

  const ITEMS_PER_PAGE = 6;

  // Popular interests - unbiased selection
  const popularInterests = useMemo(() => {
    return POPULAR_INTERESTS_UNBIASED;
  }, []);

  // Use organized interests directly from backend constants
  const organizedInterests = useMemo(() => {
    if (!constants?.interests) return {};
    return constants.interests as Record<string, string[]>;
  }, [constants?.interests]);

  // Get all interests as flat list for SearchableDropdownModal
  const allInterestsFlat = useMemo(() => {
    const allInterests: ItemType<string>[] = [];
    Object.values(organizedInterests).forEach((interests) => {
      interests.forEach((interest) => {
        if (!allInterests.find((item) => item.value === interest)) {
          allInterests.push({ label: interest, value: interest });
        }
      });
    });
    return allInterests.sort((a, b) =>
      (a.label || "").localeCompare(b.label || "")
    );
  }, [organizedInterests]);

  // Get paginated interests for a category
  const getPaginatedInterests = useCallback(
    (category: string) => {
      const allInterests = organizedInterests[category] || [];
      const page = categoryPages[category] || 0;
      const startIdx = page * ITEMS_PER_PAGE;
      return allInterests.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    },
    [organizedInterests, categoryPages]
  );

  const getTotalPages = useCallback(
    (category: string) => {
      const allInterests = organizedInterests[category] || [];
      return Math.ceil(allInterests.length / ITEMS_PER_PAGE);
    },
    [organizedInterests]
  );

  const toggleCategory = useCallback(
    (category: string) => {
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: !prev[category],
      }));
      // Reset pagination when toggling
      if (!expandedCategories[category]) {
        setCategoryPages((prev) => ({ ...prev, [category]: 0 }));
      }
    },
    [expandedCategories]
  );

  const nextPage = useCallback(
    (category: string) => {
      const totalPages = getTotalPages(category);
      const currentPage = categoryPages[category] || 0;
      if (currentPage < totalPages - 1) {
        setCategoryPages((prev) => ({ ...prev, [category]: currentPage + 1 }));
      }
    },
    [categoryPages, getTotalPages]
  );

  const prevPage = useCallback(
    (category: string) => {
      const currentPage = categoryPages[category] || 0;
      if (currentPage > 0) {
        setCategoryPages((prev) => ({ ...prev, [category]: currentPage - 1 }));
      }
    },
    [categoryPages]
  );

  const addInterest = useCallback(
    (interest: string) => {
      const trimmed = interest.trim();
      const currentInterests = profileData?.interests || [];
      // Enforce max 10 interests limit
      if (currentInterests.length >= 10) {
        return;
      }
      if (trimmed && !currentInterests.includes(trimmed)) {
        setProfileField("interests", [...currentInterests, trimmed]);
      }
      setInterestInput("");
      Keyboard.dismiss();
    },
    [profileData?.interests, setProfileField]
  );

  const removeInterest = useCallback(
    (item: string) => {
      setProfileField(
        "interests",
        (profileData?.interests || []).filter((i) => i !== item)
      );
    },
    [profileData?.interests, setProfileField]
  );

  const isInterestSelected = useCallback(
    (interest: string) => profileData?.interests?.includes(interest),
    [profileData?.interests]
  );

  const isValid = useMemo(
    () => (profileData?.interests?.length || 0) > 0,
    [profileData?.interests]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Your Interests</Text>
        <Text style={styles.subtitle}>Select interests that define you</Text>
      </View>

      {/* Searchable Modal for all interests */}
      <SearchableModal
        label="Search All Interests"
        value={profileData?.interests || []}
        items={allInterestsFlat}
        onValueChange={(values) => {
          const interestArray = Array.isArray(values) ? values : [values];
          // Enforce max 10 interests limit
          if (interestArray.length <= 10) {
            setProfileField("interests", interestArray);
          }
        }}
        open={showCategoriesDropdown}
        onOpenChange={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
        placeholder="Select interests..."
        searchPlaceholder="Search interests..."
        noResultsText="No interests found"
        showCompleted={false}
        zIndex={10}
        multiSelect={true}
      />

      {/* Popular Interests - Unbiased */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Popular</Text>
        <View style={styles.pillContainer}>
          {popularInterests.map((interest) => {
            const isSelected = isInterestSelected(interest);
            const isAtLimit = (profileData?.interests?.length || 0) >= 10;
            const isDisabled = !isSelected && isAtLimit;
            return (
              <TouchableOpacity
                key={interest}
                onPress={() =>
                  isSelected
                    ? removeInterest(interest)
                    : addInterest(interest)
                }
                style={[
                  styles.pill,
                  isSelected && styles.pillSelected,
                  isDisabled && styles.pillDisabled,
                ]}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextSelected,
                    isDisabled && styles.pillTextDisabled,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Toggle Categories Section */}
      <TouchableOpacity
        style={styles.categoriesToggle}
        onPress={() => {
          if (Object.keys(expandedCategories).length > 0) {
            setExpandedCategories({});
          } else {
            // Expand first category by default
            const firstCategory = Object.keys(organizedInterests)[0];
            if (firstCategory) {
              setExpandedCategories({ [firstCategory]: true });
            }
          }
        }}
      >
        <Text style={styles.categoriesToggleText}>Browse by Category</Text>
        <Ionicons
          name={
            Object.keys(expandedCategories).length > 0
              ? "chevron-up"
              : "chevron-down"
          }
          size={20}
          color={PRIMARY}
        />
      </TouchableOpacity>

      {/* Category Bubbles with Pagination - Hidden by default */}
      {Object.keys(expandedCategories).length > 0 && (
        <View style={styles.sectionContainer}>
          {Object.entries(organizedInterests).map(([category]) => {
            const paginatedInterests = getPaginatedInterests(category);
            const totalPages = getTotalPages(category);
            const currentPage = categoryPages[category] || 0;
            const isExpanded = expandedCategories[category];

            return (
              <View key={category}>
                {/* Category Bubble */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.categoryBubble,
                    isExpanded && styles.categoryBubbleExpanded,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isExpanded && styles.categoryTextExpanded,
                    ]}
                  >
                    {category}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isExpanded ? "white" : DARK}
                  />
                </TouchableOpacity>

                {/* Expanded Category Items with Pagination */}
                {isExpanded && (
                  <View style={styles.expandedItemsContainer}>
                    {paginatedInterests.map((interest) => {
                      const isSelected = isInterestSelected(interest);
                      const isAtLimit = (profileData?.interests?.length || 0) >= 10;
                      const isDisabled = !isSelected && isAtLimit;
                      return (
                      <TouchableOpacity
                        key={interest}
                        onPress={() =>
                          isSelected
                            ? removeInterest(interest)
                            : addInterest(interest)
                        }
                        disabled={isDisabled}
                        style={[
                          styles.categoryItem,
                          isSelected &&
                            styles.categoryItemSelected,
                          isDisabled && styles.categoryItemDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryItemText,
                            isSelected &&
                              styles.categoryItemTextSelected,
                            isDisabled && styles.categoryItemTextDisabled,
                          ]}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            currentPage === 0 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() => prevPage(category)}
                          disabled={currentPage === 0}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={16}
                            color={currentPage === 0 ? "#CCC" : PRIMARY}
                          />
                        </TouchableOpacity>
                        <Text style={styles.paginationText}>
                          {currentPage + 1} / {totalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            currentPage >= totalPages - 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() => nextPage(category)}
                          disabled={currentPage >= totalPages - 1}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={
                              currentPage >= totalPages - 1 ? "#CCC" : PRIMARY
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Custom Interest Input */}
      {(profileData?.interests?.length || 0) < 10 && (
        <View style={styles.customInputContainer}>
          <Text style={styles.sectionTitle}>Add Custom Interest</Text>
          <View style={styles.interestInputContainer}>
            <TextInput
              style={styles.interestInput}
              placeholder="Type an interest..."
              value={interestInput}
              onChangeText={setInterestInput}
              placeholderTextColor={MUTED}
              onSubmitEditing={() => addInterest(interestInput)}
              returnKeyType="done"
              editable={(profileData?.interests?.length || 0) < 10}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addInterest(interestInput)}
              disabled={(profileData?.interests?.length || 0) >= 10}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selected Interests Display */}
      {(profileData?.interests?.length || 0) > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.sectionTitle}>
            Selected ({profileData?.interests?.length})
          </Text>
          <View style={styles.selectedInterestsWrapper}>
            {(profileData?.interests || []).map((item) => (
              <View key={item} style={styles.interestTag}>
                <Text style={styles.interestText}>{item}</Text>
                <TouchableOpacity onPress={() => removeInterest(item)}>
                  <Ionicons name="close-circle" size={18} color={DARK} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BACKGROUND,
  },
  headerSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    padding: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 0,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 28,
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
  pillDisabled: {
    opacity: 0.5,
    borderColor: "#d1d5db",
  },
  pillTextDisabled: {
    color: "#9ca3af",
  },
  categoryBubble: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryBubbleExpanded: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK,
    flex: 1,
  },
  categoryTextExpanded: {
    color: "white",
  },
  expandedItemsContainer: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    marginLeft: 2,
    marginRight: 2,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderTopWidth: 0,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 5,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryItemSelected: {
    backgroundColor: `${SECONDARY}15`,
    borderColor: SECONDARY,
    borderWidth: 1.5,
    shadowColor: SECONDARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryItemDisabled: {
    opacity: 0.5,
    borderColor: "#d1d5db",
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: DARK,
    fontWeight: "500",
  },
  categoryItemTextSelected: {
    color: SECONDARY,
    fontWeight: "600",
  },
  categoryItemTextDisabled: {
    color: "#9ca3af",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    borderColor: "#CCC",
  },
  paginationText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
  },
  customInputContainer: {
    marginBottom: 28,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  interestInputContainer: {
    flexDirection: "row",
    width: "100%",
  },
  interestInput: {
    flex: 1,
    padding: 13,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginRight: 10,
    fontSize: 14,
    color: DARK,
    backgroundColor: "white",
  },
  addButton: {
    paddingHorizontal: 18,
    backgroundColor: PRIMARY,
    borderRadius: 12,
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
  },
  selectedInterestsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  interestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  interestText: {
    marginRight: 8,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  categoriesToggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK,
  },
});
