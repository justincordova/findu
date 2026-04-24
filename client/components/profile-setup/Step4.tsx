// React core

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
// React Native
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Third-party
import DropDownPicker, { type ItemType } from "react-native-dropdown-picker";
// Project imports
import {
  BACKGROUND,
  DARK,
  GRADIENT,
  MUTED,
  SECONDARY,
} from "@/constants/theme";
import { useConstantsStore } from "@/store/constantsStore";
import { useProfileSetupStore } from "@/store/profileStore";

// Types
interface Step4Props {
  onValidityChange?: (isValid: boolean) => void;
}

/**
 * Step 4: Preferences - sexual orientation and age range
 */
export default function Step4({ onValidityChange }: Step4Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore(
    (state) => state.setProfileField,
  );
  const constants = useConstantsStore((state) => state.constants);

  /** Active dropdown state for orientation */
  const [activeDropdown, setActiveDropdown] = useState<"orientation" | null>(
    null,
  );

  /** Dropdown items */
  const orientationItems: ItemType<string>[] = useMemo(
    () =>
      constants?.sexualOrientations?.map((orientation) => ({
        label: orientation,
        value: orientation,
      })) ?? [],
    [constants?.sexualOrientations],
  );

  /** Gender preference options (multi-select tap boxes) */
  const genderOptions = useMemo(
    () => constants?.genderPreferences ?? [],
    [constants?.genderPreferences],
  );

  /** Intent options (tap boxes) - aligned with discovery algorithm intent matrix (8 intents) */
  const intentOptions = useMemo(
    () => constants?.intents ?? [],
    [constants?.intents],
  );

  /** Dropdown handlers */
  const handleOpen = (key: "orientation") =>
    setActiveDropdown((prev) => (prev === key ? null : key));
  const getZIndex = (key: "orientation", baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  /** Intent selection */
  const toggleIntent = useCallback(
    (intent: string) => setProfileField("intent", intent),
    [setProfileField],
  );
  const isIntentSelected = useCallback(
    (intent: string) => profileData?.intent === intent,
    [profileData?.intent],
  );

  /** Gender preference selection */
  const toggleGenderPreference = useCallback(
    (gender: string) => {
      const current = profileData?.gender_preference ?? [];
      const isAllSelected = current.includes("All");

      if (gender === "All") {
        if (isAllSelected) {
          setProfileField("gender_preference", []);
        } else {
          setProfileField("gender_preference", ["All"]);
        }
      } else {
        if (isAllSelected) {
          setProfileField("gender_preference", [gender]);
        } else {
          if (current.includes(gender)) {
            setProfileField(
              "gender_preference",
              current.filter((g) => g !== gender),
            );
          } else {
            setProfileField("gender_preference", [...current, gender]);
          }
        }
      }
    },
    [profileData?.gender_preference, setProfileField],
  );
  const isGenderSelected = useCallback(
    (gender: string) => profileData?.gender_preference?.includes(gender),
    [profileData?.gender_preference],
  );

  /** Validity check */
  const isValid = useMemo(
    () =>
      !!profileData?.sexual_orientation &&
      Array.isArray(profileData?.gender_preference) &&
      profileData.gender_preference.length > 0 &&
      !!profileData?.intent,
    [profileData],
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /** DropDownPicker requires setItems even if unused */
  const emptyCallback = useCallback(() => {}, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      {/* Sexual Orientation */}
      <View
        style={[
          styles.fieldContainer,
          { zIndex: getZIndex("orientation", 2000) },
        ]}
      >
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Sexual Orientation</Text>
        </View>
        <DropDownPicker<string>
          placeholder="Select orientation"
          open={activeDropdown === "orientation"}
          value={profileData?.sexual_orientation ?? ""}
          items={orientationItems}
          setOpen={() => handleOpen("orientation")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData?.sexual_orientation ?? "")
                : callback;
            setProfileField("sexual_orientation", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={[
            styles.dropdown,
            profileData?.sexual_orientation
              ? { borderColor: SECONDARY, borderWidth: 2 }
              : undefined,
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { position: "absolute", zIndex: getZIndex("orientation", 2000) },
          ]}
        />
      </View>

      {/* Gender Preference (multi-select tap boxes) */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Preferred Gender(s)</Text>
        </View>
        <View style={styles.intentContainer}>
          {genderOptions.map((gender) => {
            const selected = isGenderSelected(gender);
            const disabled =
              profileData?.gender_preference?.includes("All") &&
              gender !== "All";

            return selected && !disabled ? (
              <LinearGradient
                key={gender}
                colors={GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.intentBox}
              >
                <TouchableOpacity
                  onPress={() => toggleGenderPreference(gender)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.intentText, styles.intentTextSelected]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={gender}
                onPress={() => toggleGenderPreference(gender)}
                style={[styles.intentBox, disabled && styles.disabled]}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.intentText,
                    selected && styles.intentTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Intent Selection */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Looking For</Text>
        </View>
        <View style={styles.intentContainer}>
          {intentOptions.map((intent) => {
            const selected = isIntentSelected(intent);

            return selected ? (
              <LinearGradient
                key={intent}
                colors={GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.intentBox}
              >
                <TouchableOpacity
                  onPress={() => toggleIntent(intent)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.intentText, styles.intentTextSelected]}>
                    {intent}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={intent}
                onPress={() => toggleIntent(intent)}
                style={styles.intentBox}
              >
                <Text style={styles.intentText}>{intent}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
    marginBottom: 28,
    alignItems: "center",
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
    textAlign: "center",
    lineHeight: 22,
  },
  fieldContainer: { marginBottom: 24, position: "relative" },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 0,
    textAlign: "center",
  },
  dropdown: {
    backgroundColor: "white",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  intentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  intentBox: {
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 4,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  intentBoxSelected: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  intentText: { fontSize: 14, color: DARK, textAlign: "center" },
  intentTextSelected: { color: "white", fontWeight: "600" },
  disabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    opacity: 0.5,
  },
});
