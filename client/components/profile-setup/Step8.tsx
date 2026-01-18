// React core
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [activeDropdowns, setActiveDropdowns] = useState<Record<string, boolean>>({});

  const lifestyleOptions = constants?.lifestyleOptions;

  const currentLifestyle = useMemo(
    () => (profileData?.lifestyle || {}) as Lifestyle,
    [profileData?.lifestyle]
  );

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
      if (!constantKey || !lifestyleOptions) return [];
      return ((lifestyleOptions as Record<string, readonly string[]>)[constantKey] as string[]) || [];
    },
    [lifestyleOptions]
  );

  // Toggle dropdown visibility
  const toggleDropdown = useCallback((field: keyof Lifestyle) => {
    setActiveDropdowns((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  /** Handle single-select field change */
  const handleSelectField = useCallback(
    (field: keyof Lifestyle, value: string) => {
      const updated = { ...currentLifestyle, [field]: value.length > 0 ? value : undefined };
      setProfileField("lifestyle", updated);
      setActiveDropdowns((prev) => ({ ...prev, [field]: false }));
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

      <View style={styles.formContainer}>
        {lifestyleFields.map((fieldConfig) => {
          const options = getFieldOptions(fieldConfig.key);
          if (options.length === 0) return null;

          const currentValue = currentLifestyle[fieldConfig.key];
          const isMultiSelect = fieldConfig.type === "multi";
          const displayValue = isMultiSelect
            ? Array.isArray(currentValue)
              ? currentValue.join(", ")
              : "Select..."
            : (currentValue as string) || "Select...";

          return (
            <View key={fieldConfig.key} style={styles.formField}>
              <Text style={styles.formLabel}>{fieldConfig.label}</Text>

              {/* Unified dropdown for all field types */}
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  currentValue && styles.dropdownButtonFilled,
                ]}
                onPress={() => toggleDropdown(fieldConfig.key)}
              >
                <Text style={styles.dropdownText}>
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
                <View style={[styles.dropdownModalContent, { marginTop: 4 }]}>
                  {/* Options */}
                  {options.map((option) => {
                    const isSelected = isMultiSelect
                      ? Array.isArray(currentValue) &&
                        currentValue.includes(option)
                      : currentValue === option;

                    return (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownOption}
                        onPress={() => {
                          if (isMultiSelect) {
                            handleMultiSelectField(fieldConfig.key, option);
                          } else {
                            // For single-select: click again to deselect
                            if (isSelected) {
                              handleSelectField(fieldConfig.key, "");
                            } else {
                              handleSelectField(fieldConfig.key, option);
                            }
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
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
  formContainer: {
    gap: 16,
  },
  formField: {
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
  dropdownButtonFilled: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },
  dropdownText: {
    fontSize: 14,
    color: DARK,
    flex: 1,
  },
  dropdownModalContent: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
    overflow: "hidden",
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: DARK,
    flex: 1,
  },
});
