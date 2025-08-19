import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step2Props {
  data: ProfileSetupData; // Current profile data from parent
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Callback to update parent state
  onNext: () => void; // Callback to move to next step
}

// Predefined university and major options
const universities = [
  "NJIT", "Rutgers", "Northeastern", "Bucknell",
  "Villanova", "Wisconsin", "Brown", "UC Irvine", "UPenn"
];

const majors = [
  "Computer Science", "Mechanical Engineering",
  "Biology", "Economics", "Math", "Psychology"
];

export default function Step2({ data, onUpdate, onNext }: Step2Props) {
  const canContinue = true; // Placeholder: can add validation later
  const navigation = useNavigation(); // For back navigation

  /** University input state */
  const [univText, setUnivText] = useState(data.university || ""); // Controlled input
  const [univOpen, setUnivOpen] = useState(false); // Show/hide suggestions
  const [filteredUnivs, setFilteredUnivs] = useState<string[]>(universities); // Filtered list

  /** Select a university from suggestions */
  const selectUniversity = useCallback(
    (univ: string) => {
      setUnivText(univ); // Update input field
      onUpdate({ university: univ }); // Update parent state
      setUnivOpen(false); // Close suggestion list
    },
    [onUpdate]
  );

  /** Filter university suggestions based on input */
  const handleUnivChange = useCallback((text: string) => {
    setUnivText(text); // Update input
    setUnivOpen(true); // Show suggestions
    setFilteredUnivs(universities.filter(u => u.toLowerCase().includes(text.toLowerCase())));
  }, []);

  /** Major input state */
  const [majorText, setMajorText] = useState(data.major || "");
  const [majorOpen, setMajorOpen] = useState(false); // Show/hide suggestions
  const [filteredMajors, setFilteredMajors] = useState<string[]>(majors);

  /** Select a major from suggestions */
  const selectMajor = useCallback(
    (major: string) => {
      setMajorText(major); // Update input
      onUpdate({ major }); // Update parent state
      setMajorOpen(false); // Close suggestion list
    },
    [onUpdate]
  );

  /** Filter major suggestions based on input */
  const handleMajorChange = useCallback((text: string) => {
    setMajorText(text);
    setMajorOpen(true);
    setFilteredMajors(majors.filter(m => m.toLowerCase().includes(text.toLowerCase())));
  }, []);

  /** University year dropdown state */
  const [yearOpen, setYearOpen] = useState(false);
  const [yearValue, setYearValue] = useState<ProfileSetupData["university_year"] | null>(
    data.university_year ?? null
  );

  /** University year options */
  const yearItems = useMemo(() => [
    { label: "Freshman", value: "Freshman" as ProfileSetupData["university_year"] },
    { label: "Sophomore", value: "Sophomore" as ProfileSetupData["university_year"] },
    { label: "Junior", value: "Junior" as ProfileSetupData["university_year"] },
    { label: "Senior", value: "Senior" as ProfileSetupData["university_year"] },
    { label: "Graduate", value: "Graduate" as ProfileSetupData["university_year"] },
  ], []);

  /** Update university year selection */
  const handleYearChange = useCallback(
    (value: ProfileSetupData["university_year"] | null) => {
      setYearValue(value);
      if (value) onUpdate({ university_year: value });
    },
    [onUpdate]
  );

  /** DropDownPicker requires a setItems callback even if unused */
  const emptyCallback = useCallback(() => {}, []);

  /** Graduation year dropdown state */
  const [gradOpen, setGradOpen] = useState(false);
  const [gradValue, setGradValue] = useState<ProfileSetupData["grad_year"] | null>(
    data.grad_year ?? null
  );

  /** Graduation year options: current year → 2030 */
  const gradItems = useMemo(() => {
    const now = new Date();
    const startYear = now.getFullYear();
    const endYear = 2030;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
      label: (startYear + i).toString(),
      value: startYear + i,
    }));
  }, []);

  /** Update graduation year selection */
  const handleGradChange = useCallback(
    (value: number | null) => {
      if (value !== null) {
        setGradValue(value);
        onUpdate({ grad_year: value });
      }
    },
    [onUpdate]
  );

  /** Back button handler */
  const handleBack = useCallback(() => {
    navigation.goBack(); // Navigate to previous screen
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Academic Information</Text>
        <Text style={styles.subtitle}>Tell us about your studies</Text>
      </View>

      {/* University input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>University *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your university"
          placeholderTextColor={MUTED}
          value={univText}
          onChangeText={handleUnivChange} // Filter suggestions as user types
        />
        {univOpen && filteredUnivs.length > 0 && (
          <View style={styles.dropdownList}>
            {filteredUnivs.map(u => (
              <TouchableOpacity key={u} onPress={() => selectUniversity(u)} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Major input */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Major *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your major"
          placeholderTextColor={MUTED}
          value={majorText}
          onChangeText={handleMajorChange} // Filter suggestions as user types
        />
        {majorOpen && filteredMajors.length > 0 && (
          <View style={styles.dropdownList}>
            {filteredMajors.map(m => (
              <TouchableOpacity key={m} onPress={() => selectMajor(m)} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* University Year dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 2000 }]}>
        <Text style={styles.label}>University Year *</Text>
        <DropDownPicker<ProfileSetupData["university_year"]>
          placeholder="Select your year"
          open={yearOpen}
          value={yearValue}
          items={yearItems}
          setOpen={setYearOpen}
          setValue={setYearValue as any}
          setItems={emptyCallback}
          onChangeValue={handleYearChange} // Sync with parent state
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
        />
      </View>

      {/* Graduation Year dropdown */}
      <View style={[styles.fieldContainer, { zIndex: 1000 }]}>
        <Text style={styles.label}>Graduation Year *</Text>
        <DropDownPicker<number>
          placeholder="Select your graduation year"
          open={gradOpen}
          value={gradValue}
          items={gradItems}
          setOpen={setGradOpen}
          setValue={setGradValue as any}
          setItems={emptyCallback}
          onChangeValue={handleGradChange} // Sync with parent state
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
          listMode="SCROLLVIEW"
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
  input: { width: "100%", padding: 16, backgroundColor: BACKGROUND, borderRadius: 12, fontSize: 16, color: DARK, borderWidth: 1, borderColor: "#e5e7eb" },
  dropdownList: { backgroundColor: BACKGROUND, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, marginTop: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  dropdownText: { color: DARK, fontSize: 16 },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
  dropdown: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12, minHeight: 44, paddingHorizontal: 8, marginBottom: 8 },
  dropdownContainer: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12 },
  placeholderStyle: { color: MUTED, fontSize: 16, fontWeight: "400" },
});
