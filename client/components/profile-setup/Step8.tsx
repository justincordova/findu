// React core
import { useCallback, useEffect, useMemo } from "react";

// React Native
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";

// Project imports
import {
  BACKGROUND,
  DARK,
  MUTED,
  PRIMARY,
  SECONDARY,
} from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useConstantsStore } from "@/store/constantsStore";
import { Lifestyle } from "@/types/Lifestyle";

// Types
interface Step8Props {
  onValidityChange?: (isValid: boolean) => void;
  onNext?: () => void;
}

/**
 * Step 8: Lifestyle - optional lifestyle preferences (skippable)
 * Users can select 0-11 lifestyle fields from predefined options.
 * This step is completely optional with no validation required.
 */
export default function Step8({
  onValidityChange,
  onNext,
}: Step8Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);
  const constants = useConstantsStore((state) => state.constants);

  const lifestyleOptions = constants?.lifestyleOptions;

  const currentLifestyle = useMemo(
    () => (profileData?.lifestyle || {}) as Lifestyle,
    [profileData?.lifestyle]
  );

  /** Handle single-select field change */
  const handleSelectField = useCallback(
    (field: keyof Lifestyle, value: string) => {
      const updated = { ...currentLifestyle, [field]: value };
      setProfileField("lifestyle", updated);
    },
    [currentLifestyle, setProfileField]
  );

  /** Handle multi-select field (pets, dietary_preferences) */
  const handleMultiSelectField = useCallback(
    (field: keyof Lifestyle, value: string) => {
      const current = (currentLifestyle[field] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setProfileField("lifestyle", {
        ...currentLifestyle,
        [field]: updated.length > 0 ? updated : undefined,
      });
    },
    [currentLifestyle, setProfileField]
  );

  /** Step is always valid (optional step) */
  const isValid = useMemo(() => true, []);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  if (!lifestyleOptions) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Tell us about your lifestyle</Text>
      <Text style={styles.subtitle}>(Optional - you can skip this)</Text>

      {/* Drinking */}
      {lifestyleOptions.drinking && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Drinking</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.drinking.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.drinking === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("drinking", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.drinking === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Smoking */}
      {lifestyleOptions.smoking && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Smoking</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.smoking.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.smoking === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("smoking", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.smoking === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Cannabis */}
      {lifestyleOptions.cannabis && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Cannabis</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.cannabis.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.cannabis === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("cannabis", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.cannabis === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sleep Habits */}
      {lifestyleOptions.sleepHabits && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Sleep Habits</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.sleepHabits.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.sleep_habits === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("sleep_habits", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.sleep_habits === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Pets (multi-select) */}
      {lifestyleOptions.pets && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Pets</Text>
          <View style={styles.pillContainer}>
            {lifestyleOptions.pets.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pill,
                  (currentLifestyle.pets || []).includes(option) &&
                    styles.pillSelected,
                ]}
                onPress={() => handleMultiSelectField("pets", option)}
              >
                <Text
                  style={[
                    styles.pillText,
                    (currentLifestyle.pets || []).includes(option) &&
                      styles.pillTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Dietary Preferences (multi-select) */}
      {lifestyleOptions.dietaryPreferences && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Dietary Preferences</Text>
          <View style={styles.pillContainer}>
            {lifestyleOptions.dietaryPreferences.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pill,
                  (currentLifestyle.dietary_preferences || []).includes(
                    option
                  ) && styles.pillSelected,
                ]}
                onPress={() => handleMultiSelectField("dietary_preferences", option)}
              >
                <Text
                  style={[
                    styles.pillText,
                    (currentLifestyle.dietary_preferences || []).includes(
                      option
                    ) && styles.pillTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Study Style */}
      {lifestyleOptions.studyStyle && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Study Style</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.studyStyle.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.study_style === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("study_style", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.study_style === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Cleanliness */}
      {lifestyleOptions.cleanliness && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Cleanliness</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.cleanliness.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.cleanliness === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("cleanliness", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.cleanliness === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Caffeine */}
      {lifestyleOptions.caffeine && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Caffeine</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.caffeine.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.caffeine === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("caffeine", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.caffeine === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Living Situation */}
      {lifestyleOptions.livingSituation && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Living Situation</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.livingSituation.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.living_situation === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("living_situation", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.living_situation === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Fitness */}
      {lifestyleOptions.fitness && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Fitness</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.fitness.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  currentLifestyle.fitness === option &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectField("fitness", option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentLifestyle.fitness === option &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Skip button for optional step */}
      <View style={styles.skipButtonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onNext}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
          <Ionicons name="arrow-forward" size={16} color={PRIMARY} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9f9f9",
  },
  optionButtonSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  optionText: {
    fontSize: 13,
    color: DARK,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "white",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pillSelected: {
    backgroundColor: SECONDARY,
    borderColor: SECONDARY,
  },
  pillText: {
    fontSize: 13,
    color: DARK,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "white",
  },
  skipButtonContainer: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "500",
  },
});
