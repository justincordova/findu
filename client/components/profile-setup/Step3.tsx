import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step3Props {
  data: ProfileSetupData; // Current profile data from parent
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Callback to update parent state
  onNext: () => void; // Callback to move to next step
}

export default function Step3({ data, onUpdate, onNext }: Step3Props) {
  const navigation = useNavigation(); // For back navigation
  const canContinue = true; // Placeholder: enable/disable based on validation

  /** Pronouns dropdown state */
  const [pronounOpen, setPronounOpen] = useState(false);
  const [pronounValue, setPronounValue] = useState<string>(data.pronouns ?? "");

  /** Pronouns options */
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

  /** Update pronouns both locally and in parent */
  const handlePronounChange = useCallback(
    (value: string | null) => {
      if (value) {
        setPronounValue(value);
        onUpdate({ pronouns: value });
      }
    },
    [onUpdate]
  );

  /** Sexual orientation dropdown state */
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [orientationValue, setOrientationValue] = useState<ProfileSetupData["sexualOrientation"]>(
    data.sexualOrientation ?? "Straight"
  );

  /** Sexual orientation options */
  const orientationItems: ItemType<ProfileSetupData["sexualOrientation"]>[] = useMemo(
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

  /** Update sexual orientation both locally and in parent */
  const handleOrientationChange = useCallback(
    (value: ProfileSetupData["sexualOrientation"] | null) => {
      if (value) {
        setOrientationValue(value);
        onUpdate({ sexualOrientation: value });
      }
    },
    [onUpdate]
  );

  /** Gender preference dropdown state */
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState<ProfileSetupData["genderPreference"]>(
    data.genderPreference ?? "All"
  );

  /** Gender preference options */
  const genderItems: ItemType<ProfileSetupData["genderPreference"]>[] = useMemo(
    () => [
      { label: "Men", value: "Men" },
      { label: "Women", value: "Women" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "All", value: "All" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  /** Update gender preference both locally and in parent */
  const handleGenderChange = useCallback(
    (value: ProfileSetupData["genderPreference"] | null) => {
      if (value) {
        setGenderValue(value);
        onUpdate({ genderPreference: value });
      }
    },
    [onUpdate]
  );

  /** Back button handler */
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  /** DropDownPicker requires a setItems callback even if unused */
  const emptyCallback = useCallback(() => {}, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      {/* Pronouns dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 3000 }]}>
        <Text style={styles.label}>Pronouns</Text>
        <DropDownPicker<string>
          placeholder="Select pronouns"
          open={pronounOpen}
          value={pronounValue}
          items={pronounItems}
          setOpen={setPronounOpen}
          setValue={setPronounValue as any}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          onChangeValue={handlePronounChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
        />
      </View>

      {/* Sexual Orientation dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 2000 }]}>
        <Text style={styles.label}>Sexual Orientation</Text>
        <DropDownPicker<ProfileSetupData["sexualOrientation"]>
          placeholder="Select orientation"
          open={orientationOpen}
          value={orientationValue}
          items={orientationItems}
          setOpen={setOrientationOpen}
          setValue={setOrientationValue as any}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          onChangeValue={handleOrientationChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
        />
      </View>

      {/* Gender Preference dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 1000 }]}>
        <Text style={styles.label}>Preferred Gender</Text>
        <DropDownPicker<ProfileSetupData["genderPreference"]>
          placeholder="Select preferred gender"
          open={genderOpen}
          value={genderValue}
          items={genderItems}
          setOpen={setGenderOpen}
          setValue={setGenderValue as any}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          onChangeValue={handleGenderChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
        />
      </View>

      {/* Continue button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center" },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
  dropdown: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12, minHeight: 44, paddingHorizontal: 8, marginBottom: 8 },
  dropdownContainer: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12 },
  placeholderStyle: { color: MUTED, fontWeight: "400", fontSize: 16 },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
