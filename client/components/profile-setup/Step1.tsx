import React, { useMemo, useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Dimensions } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileSetupStore";

interface Step1Props {
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey = "age" | "gender" | null;

export default function Step1({ onValidityChange }: Step1Props) {
  const profileData = useProfileSetupStore(state => state.data);
  const setField = useProfileSetupStore(state => state.setField);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);

  const isValid = useMemo(
    () =>
      (profileData.name ?? "").trim() !== "" &&
      String(profileData.age ?? "").trim() !== "" &&
      (profileData.gender ?? "") !== "",
    [profileData]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const ageItems: ItemType<string>[] = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ label: `${i + 18}`, value: `${i + 18}` })),
    []
  );

  const genderItems: ItemType<"" | "Male" | "Female" | "Non-binary" | "Other">[] = useMemo(
    () => [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const emptyCallback = useCallback(() => {}, []);
  const screenHeight = Dimensions.get("window").height;

  const handleOpen = (key: DropdownKey) => {
    setActiveDropdown(prev => (prev === key ? null : key));
  };

  const getZIndex = (key: DropdownKey, baseZ: number) => (activeDropdown === key ? 5000 : baseZ);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>Please enter your name, age, and gender</Text>

        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor={MUTED}
            value={profileData.name ?? ""}
            onChangeText={text => setField("name", text)}
          />
        </View>

        {/* Age */}
        <View style={[styles.fieldContainer, { zIndex: getZIndex("age", 2) }]}>
          <Text style={styles.label}>Age *</Text>
          <DropDownPicker<string>
            placeholder="Select your age"
            open={activeDropdown === "age"}
            value={profileData.age ? String(profileData.age) : ""}
            items={ageItems}
            setOpen={() => handleOpen("age")}
            setValue={(callback) => {
              const val = typeof callback === "function" ? callback(profileData.age ?? "") : callback;
              setField("age", val ?? "");
            }}
            setItems={emptyCallback}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={[styles.dropdownContainer, { maxHeight: screenHeight * 0.4 }]}
          />
        </View>

        {/* Gender */}
        <View style={[styles.fieldContainer, { zIndex: getZIndex("gender", 1) }]}>
          <Text style={styles.label}>Gender *</Text>
          <DropDownPicker<"" | "Male" | "Female" | "Non-binary" | "Other">
            placeholder="Select your gender"
            open={activeDropdown === "gender"}
            value={profileData.gender ?? ""}
            items={genderItems}
            setOpen={() => handleOpen("gender")}
            setValue={(callback) => {
              const val = typeof callback === "function" ? callback(profileData.gender ?? "") : callback;
              setField("gender", val ?? "");
            }}
            setItems={emptyCallback}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={[styles.dropdownContainer, { maxHeight: screenHeight * 0.4 }]}
          />
        </View>
      </View>
    </ScrollView>
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
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, marginBottom: 32, textAlign: "center" },
  fieldContainer: { marginBottom: 24, position: "relative" },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
  input: {
    width: "100%",
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 0,
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
});
