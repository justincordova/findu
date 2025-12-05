import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DARK,
  MUTED,
  BACKGROUND,
  PRIMARY,
} from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

// Canonical interest categories and popular interests for quick selection
const INTEREST_CATEGORIES = {
  Technology: [
    "Coding",
    "Web Development",
    "AI",
    "Tech",
    "Startups",
  ],
  Gaming: [
    "Gaming",
    "Esports",
    "Video Games",
    "Board Games",
    "Streaming",
  ],
  Entertainment: [
    "Movies",
    "TV Shows",
    "Music",
    "Comedy",
    "Podcasts",
  ],
  Creative: [
    "Photography",
    "Art",
    "Design",
    "Writing",
    "Music Production",
  ],
  Sports: [
    "Basketball",
    "Soccer",
    "Fitness",
    "Hiking",
    "Gym",
  ],
  Wellness: [
    "Yoga",
    "Meditation",
    "Running",
    "Mental Health",
    "Nutrition",
  ],
  Outdoor: [
    "Hiking",
    "Camping",
    "Beach",
    "Rock Climbing",
    "Skiing",
  ],
  Culinary: [
    "Cooking",
    "Baking",
    "Food",
    "Coffee",
    "Wine Tasting",
  ],
  Intellectual: [
    "Reading",
    "Philosophy",
    "Science",
    "History",
    "Languages",
  ],
  Social: [
    "Socializing",
    "Parties",
    "Networking",
    "Traveling",
    "Making Friends",
  ],
  Animals: [
    "Dogs",
    "Cats",
    "Pet Lover",
    "Wildlife",
    "Conservation",
  ],
  Home: [
    "Interior Design",
    "Gardening",
    "DIY",
    "Home Improvement",
    "Plants",
  ],
  Fashion: [
    "Fashion",
    "Shopping",
    "Makeup",
    "Thrifting",
    "Style",
  ],
  Business: [
    "Entrepreneurship",
    "Marketing",
    "Finance",
    "Economics",
    "Business",
  ],
  Music: [
    "Live Music",
    "Concerts",
    "DJ",
    "Indie Music",
    "Pop",
  ],
  Lifestyle: [
    "Travel",
    "Adventure",
    "Self-improvement",
    "Spirituality",
    "Minimalism",
  ],
};

interface ExpandedCategories {
  [key: string]: boolean;
}

export default function Step7({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  const [interestInput, setInterestInput] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategories>({});
  const keyboardHeight = useState(new Animated.Value(0))[0];

  // Popular interests for quick selection
  const popularInterests = useMemo(() => {
    return [
      "Travel",
      "Photography",
      "Gaming",
      "Hiking",
      "Music",
      "Cooking",
      "Fitness",
      "Reading",
      "Yoga",
      "Art",
      "Movies",
      "Socializing",
    ];
  }, []);

  /**
   * Toggle category expansion
   */
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  /**
   * Add interest from category or custom input
   */
  const addInterest = useCallback(
    (interest: string) => {
      const trimmed = interest.trim();
      if (trimmed && !profileData?.interests?.includes(trimmed)) {
        setProfileField("interests", [...(profileData?.interests || []), trimmed]);
      }
      setInterestInput("");
      Keyboard.dismiss();
    },
    [profileData?.interests, setProfileField]
  );

  /**
   * Remove interest
   */
  const removeInterest = useCallback(
    (item: string) => {
      setProfileField(
        "interests",
        (profileData?.interests || []).filter((i) => i !== item)
      );
    },
    [profileData?.interests, setProfileField]
  );

  /**
   * Check if interest is already selected
   */
  const isInterestSelected = useCallback(
    (interest: string) => profileData?.interests?.includes(interest),
    [profileData?.interests]
  );

  /**
   * Step validity: require at least one interest
   */
  const isValid = useMemo(
    () => (profileData?.interests?.length || 0) > 0,
    [profileData?.interests]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /**
   * Keyboard listeners for ScrollView adjustment
   */
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Animated.ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Your Interests</Text>
          <Text style={styles.subtitle}>
            Select interests that define you
          </Text>

          {/* Popular Interests Pills */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Popular</Text>
            <View style={styles.pillContainer}>
              {popularInterests.map((interest) => (
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
                >
                  <Text
                    style={[
                      styles.pillText,
                      isInterestSelected(interest) && styles.pillTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Bubbles */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
              <View key={category}>
                {/* Category Bubble */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.categoryBubble,
                    expandedCategories[category] && styles.categoryBubbleExpanded,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      expandedCategories[category] && styles.categoryTextExpanded,
                    ]}
                  >
                    {category}
                  </Text>
                  <Ionicons
                    name={expandedCategories[category] ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={expandedCategories[category] ? "white" : DARK}
                  />
                </TouchableOpacity>

                {/* Expanded Category Items */}
                {expandedCategories[category] && (
                  <View style={styles.expandedItemsContainer}>
                    {interests.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        onPress={() =>
                          isInterestSelected(interest)
                            ? removeInterest(interest)
                            : addInterest(interest)
                        }
                        style={[
                          styles.categoryItem,
                          isInterestSelected(interest) && styles.categoryItemSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryItemText,
                            isInterestSelected(interest) && styles.categoryItemTextSelected,
                          ]}
                        >
                          {interest}
                        </Text>
                        {isInterestSelected(interest) && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={PRIMARY}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Custom Interest Input */}
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
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addInterest(interestInput)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selected Interests Display */}
          {(profileData?.interests?.length || 0) > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.sectionTitle}>
                Selected ({profileData?.interests?.length})
              </Text>
              <FlatList
                data={profileData?.interests || []}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.interestTag}>
                    <Text style={styles.interestText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeInterest(item)}>
                      <Ionicons name="close-circle" size={18} color={DARK} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 24,
    zIndex: 10,
  },
  contentContainer: {
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 24,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
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
    backgroundColor: "#eff6ff",
    borderColor: PRIMARY,
    borderWidth: 1.5,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: DARK,
    fontWeight: "500",
  },
  categoryItemTextSelected: {
    color: PRIMARY,
    fontWeight: "600",
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
  interestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 10,
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
});
