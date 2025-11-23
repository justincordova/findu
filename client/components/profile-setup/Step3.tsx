import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND, PRIMARY } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

export default function Step3({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  /** Active dropdown state for orientation */
  const [activeDropdown, setActiveDropdown] = useState<"orientation" | null>(
    null
  );

  /** Dropdown items */
  const orientationItems: ItemType<string>[] = useMemo(
    () => [
      { label: "Straight", value: "Straight" },
      { label: "Gay", value: "Gay" },
      { label: "Lesbian", value: "Lesbian" },
      { label: "Bisexual", value: "Bisexual" },
      { label: "Questioning", value: "Questioning" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  /** Gender preference options (multi-select tap boxes) */
  const genderOptions = useMemo(
    () => ["Men", "Women", "Non-binary", "All", "Other"],
    []
  );

  /** Intent options (tap boxes) */
  const intentOptions = useMemo(
    () => ["dating", "friendship", "networking", "casual"],
    []
  );

  /** Dropdown handlers */
  const handleOpen = (key: "orientation") =>
    setActiveDropdown((prev) => (prev === key ? null : key));
  const getZIndex = (key: "orientation", baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  /** Intent selection */
  const toggleIntent = useCallback(
    (intent: string) => setProfileField("intent", intent),
    [setProfileField]
  );
  const isIntentSelected = useCallback(
    (intent: string) => profileData?.intent === intent,
    [profileData?.intent]
  );

  /** Gender preference selection */
  const toggleGenderPreference = useCallback(
    (gender: string) => {
      const current = profileData?.gender_preference ?? [];
      if (current.includes(gender)) {
        setProfileField(
          "gender_preference",
          current.filter((g) => g !== gender)
        );
      } else {
        setProfileField("gender_preference", [...current, gender]);
      }
    },
    [profileData?.gender_preference, setProfileField]
  );
  const isGenderSelected = useCallback(
    (gender: string) => profileData?.gender_preference?.includes(gender),
    [profileData?.gender_preference]
  );

  /** Validity check */
  const isValid = useMemo(
    () =>
      !!profileData?.sexual_orientation &&
      Array.isArray(profileData?.gender_preference) &&
      profileData.gender_preference.length > 0 &&
      !!profileData?.intent,
    [profileData]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /** DropDownPicker requires setItems even if unused */
  const emptyCallback = useCallback(() => {}, []);

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Preferences</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

      {/* Sexual Orientation */}
      <View
        style={[
          styles.fieldContainer,
          { zIndex: getZIndex("orientation", 2000) },
        ]}
      >
        <Text style={styles.label}>Sexual Orientation</Text>
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
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { position: "absolute", zIndex: getZIndex("orientation", 2000) },
          ]}
        />
      </View>

      {/* Gender Preference (multi-select tap boxes) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Preferred Gender(s)</Text>
        <View style={styles.intentContainer}>
          {genderOptions.map((gender) => (
            <TouchableOpacity
              key={gender}
              onPress={() => toggleGenderPreference(gender)}
              style={[
                styles.intentBox,
                isGenderSelected(gender) && styles.intentBoxSelected,
              ]}
            >
              <Text
                style={[
                  styles.intentText,
                  isGenderSelected(gender) && styles.intentTextSelected,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Intent Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Looking For</Text>
        <View style={styles.intentContainer}>
          {intentOptions.map((intent) => (
            <TouchableOpacity
              key={intent}
              onPress={() => toggleIntent(intent)}
              style={[
                styles.intentBox,
                isIntentSelected(intent) && styles.intentBoxSelected,
              ]}
            >
              <Text
                style={[
                  styles.intentText,
                  isIntentSelected(intent) && styles.intentTextSelected,
                ]}
              >
                {intent.charAt(0).toUpperCase() + intent.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: BACKGROUND,
  },
  backButton: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 32,
    textAlign: "center",
  },
  fieldContainer: { marginBottom: 24, position: "relative" },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  dropdown: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: BACKGROUND,
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
    backgroundColor: BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  intentBoxSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  intentText: { fontSize: 14, color: DARK, textAlign: "center" },
  intentTextSelected: { color: "white", fontWeight: "600" },
});
