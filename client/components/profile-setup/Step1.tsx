import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step1Props {
  data: ProfileSetupData; // The current profile data from parent
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Callback to update parent state
  onNext: () => void; // Callback to move to next step
}

export default function Step1({ data, onUpdate, onNext }: Step1Props) {
  const canContinue = true; // Placeholder: could implement validation later
  const navigation = useNavigation(); // For back navigation

  /** Name field handler */
  const handleNameChange = useCallback(
    (text: string) => onUpdate({ name: text }), // Update parent state when name changes
    [onUpdate]
  );

  /** Age dropdown state */
  const [ageOpen, setAgeOpen] = useState(false); // Controls dropdown open/close
  const [ageValue, setAgeValue] = useState<number | null>(data.age ?? null); // Local value synced with parent

  /** Age options: 18–26 */
  const ageItems: ItemType<number>[] = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        label: `${i + 18}`,
        value: i + 18,
      })),
    []
  );

  /** Update age both locally and in parent */
  const handleAgeChange = useCallback(
    (value: number | null) => {
      setAgeValue(value);
      onUpdate({ age: value ?? undefined });
    },
    [onUpdate]
  );

  /** Gender dropdown state */
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState<
    "Male" | "Female" | "Non-binary" | "Other" | null
  >(data.gender ?? null); // Sync initial value from parent

  /** Gender options */
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

  /** Update gender both locally and in parent */
  const handleGenderChange = useCallback(
    (value: "Male" | "Female" | "Non-binary" | "Other" | null) => {
      setGenderValue(value);
      onUpdate({ gender: value ?? undefined });
    },
    [onUpdate]
  );

  /** DropDownPicker requires a setItems callback, we don't change items dynamically here */
  const emptyCallback = useCallback(() => {}, []);

  /** Back button handler */
  const handleBack = useCallback(() => {
    navigation.goBack(); // Navigate back in the stack
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled" // Allow taps while keyboard is open
    >
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      {/* Name input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor={MUTED}
          value={data.name} // Controlled by parent state
          onChangeText={handleNameChange}
          maxLength={50}
        />
      </View>

      {/* Age dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 2 }]}>
        <Text style={styles.label}>Age *</Text>
        <DropDownPicker<number>
          placeholder="Select your age"
          open={ageOpen}
          value={ageValue} // Local state
          items={ageItems}
          setOpen={setAgeOpen}
          setValue={setAgeValue as any} // Controlled by handleAgeChange
          setItems={emptyCallback}
          onChangeValue={handleAgeChange} // Sync with parent
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
        />
      </View>

      {/* Gender dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 1 }]}>
        <Text style={styles.label}>Gender *</Text>
        <DropDownPicker<"Male" | "Female" | "Non-binary" | "Other">
          placeholder="Select your gender"
          open={genderOpen}
          value={genderValue ?? null}
          items={genderItems}
          setOpen={setGenderOpen}
          setValue={setGenderValue as any}
          setItems={emptyCallback}
          onChangeValue={handleGenderChange} // Sync with parent
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
        />
      </View>

      {/* Continue button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue} // Enable only if valid
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
