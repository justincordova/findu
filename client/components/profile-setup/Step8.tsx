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
import { LinearGradient } from "expo-linear-gradient";

// Project imports
import {
  BACKGROUND,
  DARK,
  MUTED,
  GRADIENT,
} from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useConstantsStore } from "@/store/constantsStore";
import { Lifestyle } from "@/types/Lifestyle";

// Types
interface Step8Props {
  onValidityChange?: (isValid: boolean) => void;
}

/**
 * Step 8: Lifestyle - optional lifestyle preferences
 * Users can select 0-11 lifestyle fields from predefined options.
 * This step has no validation required - users can proceed without selecting any fields.
 */
export default function Step8({
  onValidityChange,
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
      <Text style={styles.subtitle}>(Optional)</Text>

      {/* Drinking */}
      {lifestyleOptions.drinking && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Drinking</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.drinking.map((option) => {
              const selected = currentLifestyle.drinking === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("drinking", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("drinking", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Smoking */}
      {lifestyleOptions.smoking && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Smoking</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.smoking.map((option) => {
              const selected = currentLifestyle.smoking === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("smoking", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("smoking", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Cannabis */}
      {lifestyleOptions.cannabis && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Cannabis</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.cannabis.map((option) => {
              const selected = currentLifestyle.cannabis === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("cannabis", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("cannabis", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Sleep Habits */}
      {lifestyleOptions.sleepHabits && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Sleep Habits</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.sleepHabits.map((option) => {
              const selected = currentLifestyle.sleep_habits === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("sleep_habits", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("sleep_habits", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Pets (multi-select) */}
      {lifestyleOptions.pets && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Pets</Text>
          <View style={styles.pillContainer}>
            {lifestyleOptions.pets.map((option) => {
              const selected = (currentLifestyle.pets || []).includes(option);
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pill}
                >
                  <TouchableOpacity
                    onPress={() => handleMultiSelectField("pets", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.pillText, styles.pillTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.pill}
                  onPress={() => handleMultiSelectField("pets", option)}
                >
                  <Text style={styles.pillText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Dietary Preferences (multi-select) */}
      {lifestyleOptions.dietaryPreferences && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Dietary Preferences</Text>
          <View style={styles.pillContainer}>
            {lifestyleOptions.dietaryPreferences.map((option) => {
              const selected = (currentLifestyle.dietary_preferences || []).includes(option);
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pill}
                >
                  <TouchableOpacity
                    onPress={() => handleMultiSelectField("dietary_preferences", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.pillText, styles.pillTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.pill}
                  onPress={() => handleMultiSelectField("dietary_preferences", option)}
                >
                  <Text style={styles.pillText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Study Style */}
      {lifestyleOptions.studyStyle && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Study Style</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.studyStyle.map((option) => {
              const selected = currentLifestyle.study_style === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("study_style", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("study_style", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Cleanliness */}
      {lifestyleOptions.cleanliness && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Cleanliness</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.cleanliness.map((option) => {
              const selected = currentLifestyle.cleanliness === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("cleanliness", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("cleanliness", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Caffeine */}
      {lifestyleOptions.caffeine && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Caffeine</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.caffeine.map((option) => {
              const selected = currentLifestyle.caffeine === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("caffeine", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("caffeine", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Living Situation */}
      {lifestyleOptions.livingSituation && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Living Situation</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.livingSituation.map((option) => {
              const selected = currentLifestyle.living_situation === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("living_situation", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("living_situation", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Fitness */}
      {lifestyleOptions.fitness && (
        <View style={styles.sectionContainer}>
          <Text style={styles.fieldLabel}>Fitness</Text>
          <View style={styles.optionsGrid}>
            {lifestyleOptions.fitness.map((option) => {
              const selected = currentLifestyle.fitness === option;
              return selected ? (
                <LinearGradient
                  key={option}
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionButton}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectField("fitness", option)}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => handleSelectField("fitness", option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

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
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pillText: {
    fontSize: 13,
    color: DARK,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "white",
  },
});
