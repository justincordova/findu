import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface Step1Props {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step1({ data, onUpdate, onNext, onBack }: Step1Props) {
  const canContinue = true;

  // Name handler
  const handleNameChange = useCallback(
    (text: string) => onUpdate({ name: text }),
    [onUpdate]
  );

  // Age dropdown
  const [ageOpen, setAgeOpen] = useState(false);
  const [ageValue, setAgeValue] = useState<number | null>(data.age ?? null);

  const ageItems: ItemType<number>[] = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        label: `${i + 18}`,
        value: i + 18,
      })),
    []
  );

  const handleAgeChange = useCallback(
    (value: number | null) => {
      setAgeValue(value);
      onUpdate({ age: value ?? undefined });
    },
    [onUpdate]
  );

  // Gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState<
    "Male" | "Female" | "Non-binary" | "Other" | null
  >(data.gender ?? null);

  const genderItems: ItemType<"Male" | "Female" | "Non-binary" | "Other">[] =
    useMemo(
      () => [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Non-binary", value: "Non-binary" },
        { label: "Other", value: "Other" },
      ],
      []
    );

  const handleGenderChange = useCallback(
    (value: "Male" | "Female" | "Non-binary" | "Other" | null) => {
      setGenderValue(value);
      onUpdate({ gender: value ?? undefined });
    },
    [onUpdate]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor={MUTED}
          value={data.name}
          onChangeText={handleNameChange}
          maxLength={50}
        />
      </View>

      {/* Age */}
      <View style={[styles.fieldContainer, { zIndex: 2 }]}>
        <Text style={styles.label}>Age *</Text>
        <DropDownPicker<number>
          placeholder="Select your age"
          open={ageOpen}
          value={ageValue}
          items={ageItems}
          setOpen={setAgeOpen}
          setValue={setAgeValue} // required for single selection typing
          onChangeValue={handleAgeChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
        />
      </View>

      {/* Gender */}
      <View style={[styles.fieldContainer, { zIndex: 1 }]}>
        <Text style={styles.label}>Gender *</Text>
        <DropDownPicker<"Male" | "Female" | "Non-binary" | "Other">
          placeholder="Select your gender"
          open={genderOpen}
          value={genderValue ?? null} // <-- use null, not undefined
          items={genderItems}
          setOpen={setGenderOpen}
          setValue={setGenderValue} // required
          onChangeValue={handleGenderChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
        />
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text
          style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}
        >
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center" },
  fieldContainer: { marginBottom: 24 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextDisabled: { color: MUTED },
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
  placeholderStyle: { color: MUTED, fontSize: 16, fontWeight: "400" },
});
