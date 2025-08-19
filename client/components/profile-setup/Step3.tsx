import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface Step3Props {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3({ data, onUpdate, onNext, onBack }: Step3Props) {
  const canContinue = true;

  // Pronouns
  const handleFirstPronounChange = useCallback(
    (text: string) => {
      const secondPart = data.pronouns?.split("/")[1] || "";
      onUpdate({ pronouns: `${text}/${secondPart}` });
    },
    [data.pronouns, onUpdate]
  );

  const handleSecondPronounChange = useCallback(
    (text: string) => {
      const firstPart = data.pronouns?.split("/")[0] || "";
      onUpdate({ pronouns: `${firstPart}/${text}` });
    },
    [data.pronouns, onUpdate]
  );

  // Sexual Orientation
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [orientationValue, setOrientationValue] = useState<ProfileSetupData["sexualOrientation"]>(
    data.sexualOrientation ?? "Straight"
  );
  const orientationItems: { label: string; value: ProfileSetupData["sexualOrientation"] }[] = [
    { label: "Straight", value: "Straight" },
    { label: "Gay", value: "Gay" },
    { label: "Lesbian", value: "Lesbian" },
    { label: "Bisexual", value: "Bisexual" },
    { label: "Questioning", value: "Questioning" },
    { label: "Other", value: "Other" },
  ];

  const handleOrientationChange = (value: ProfileSetupData["sexualOrientation"] | null) => {
    if (value) {
      setOrientationValue(value);
      onUpdate({ sexualOrientation: value });
    }
  };

  // Gender Preference
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState<ProfileSetupData["genderPreference"]>(
    data.genderPreference ?? "All"
  );
  const genderItems: { label: string; value: ProfileSetupData["genderPreference"] }[] = [
    { label: "Men", value: "Men" },
    { label: "Women", value: "Women" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "All", value: "All" },
    { label: "Other", value: "Other" },
  ];

  const handleGenderChange = (value: ProfileSetupData["genderPreference"] | null) => {
    if (value) {
      setGenderValue(value);
      onUpdate({ genderPreference: value });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Pronouns */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Pronouns</Text>
          <View style={styles.pronounContainer}>
            <TextInput
              style={styles.pronounInput}
              placeholder="they"
              value={data.pronouns?.split("/")[0] || ""}
              onChangeText={handleFirstPronounChange}
              maxLength={10}
              placeholderTextColor={MUTED}
            />
            <Text style={styles.pronounSlash}>/</Text>
            <TextInput
              style={styles.pronounInput}
              placeholder="them"
              value={data.pronouns?.split("/")[1] || ""}
              onChangeText={handleSecondPronounChange}
              maxLength={10}
              placeholderTextColor={MUTED}
            />
          </View>
        </View>

        {/* Sexual Orientation */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Sexual Orientation</Text>
          <DropDownPicker<ProfileSetupData["sexualOrientation"]>
            placeholder="Select orientation"
            open={orientationOpen}
            value={orientationValue}
            items={orientationItems}
            setOpen={setOrientationOpen}
            setValue={setOrientationValue as any}
            setItems={() => {}}
            listMode="SCROLLVIEW"
            onChangeValue={handleOrientationChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            zIndex={2000}
          />
        </View>

        {/* Gender Preference */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Preferred Gender</Text>
          <DropDownPicker<ProfileSetupData["genderPreference"]>
            placeholder="Select preferred gender"
            open={genderOpen}
            value={genderValue}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={setGenderValue as any}
            setItems={() => {}}
            listMode="SCROLLVIEW"
            onChangeValue={handleGenderChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            zIndex={1000}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center" },
  form: { flex: 1, marginBottom: 32 },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
  dropdown: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dropdownContainer: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12 },
  placeholderStyle: { color: MUTED, fontWeight: "400", fontSize: 16 },
  pronounContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  pronounInput: {
    minWidth: 80,
    maxWidth: 240,
    padding: 12,
    backgroundColor: BACKGROUND,
    borderRadius: 8,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    textAlign: "center",
  },
  pronounSlash: { fontSize: 18, color: MUTED, marginHorizontal: 12, fontWeight: "bold" },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
