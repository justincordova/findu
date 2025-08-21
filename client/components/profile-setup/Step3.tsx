import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND, PRIMARY } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileSetupStore";

export default function Step3({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);

  /** Pronouns */
  const [activeDropdown, setActiveDropdown] = useState<
    "pronoun" | "orientation" | "gender" | null
  >(null);

  const pronounItems: ItemType<string>[] = useMemo(
    () => [
      { label: "they/them", value: "they/them" },
      { label: "he/him", value: "he/him" },
      { label: "she/her", value: "she/her" },
      { label: "xe/xem", value: "xe/xem" },
      { label: "ze/zir", value: "ze/zir" },
      { label: "other", value: "other" },
    ],
    []
  );

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

  const genderItems: ItemType<string>[] = useMemo(
    () => [
      { label: "Men", value: "Men" },
      { label: "Women", value: "Women" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "All", value: "All" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const handleOpen = (key: "pronoun" | "orientation" | "gender") =>
    setActiveDropdown((prev) => (prev === key ? null : key));

  const getZIndex = (
    key: "pronoun" | "orientation" | "gender",
    baseZ: number
  ) => (activeDropdown === key ? 5000 : baseZ);

  /** Intent options */
  const intentOptions: ("dating" | "friendship" | "networking" | "casual")[] = [
    "dating",
    "friendship",
    "networking",
    "casual",
  ];

  const setIntent = useCallback(
    (intent: (typeof intentOptions)[number]) => {
      setField("intent", intent);
    },
    [setField]
  );

  const isIntentSelected = useCallback(
    (intent: (typeof intentOptions)[number]) => {
      return profileData.intent === intent;
    },
    [profileData.intent]
  );

  /** Validity check */
  const isValid = useMemo(
    () =>
      !!profileData.pronouns &&
      !!profileData.sexualOrientation &&
      !!profileData.genderPreference &&
      !!profileData.intent,
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

      {/* Pronouns */}
      <View
        style={[styles.fieldContainer, { zIndex: getZIndex("pronoun", 3000) }]}
      >
        <Text style={styles.label}>Pronouns</Text>
        <DropDownPicker<string>
          placeholder="Select pronouns"
          open={activeDropdown === "pronoun"}
          value={profileData.pronouns ?? ""}
          items={pronounItems}
          setOpen={() => handleOpen("pronoun")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData.pronouns ?? "")
                : callback;
            setField("pronouns", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { position: "absolute", zIndex: getZIndex("pronoun", 3000) },
          ]}
        />
      </View>

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
          value={profileData.sexualOrientation ?? ""}
          items={orientationItems}
          setOpen={() => handleOpen("orientation")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData.sexualOrientation ?? "")
                : callback;
            setField("sexualOrientation", val ?? "");
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

      {/* Gender Preference */}
      <View
        style={[styles.fieldContainer, { zIndex: getZIndex("gender", 1000) }]}
      >
        <Text style={styles.label}>Preferred Gender</Text>
        <DropDownPicker<string>
          placeholder="Select preferred gender"
          open={activeDropdown === "gender"}
          value={profileData.genderPreference ?? ""}
          items={genderItems}
          setOpen={() => handleOpen("gender")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData.genderPreference ?? "")
                : callback;
            setField("genderPreference", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { position: "absolute", zIndex: getZIndex("gender", 1000) },
          ]}
        />
      </View>

      {/* Intent Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Looking For</Text>
        <View style={styles.intentContainer}>
          {intentOptions.map((intent) => (
            <TouchableOpacity
              key={intent}
              onPress={() => setIntent(intent)}
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