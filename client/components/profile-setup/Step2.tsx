import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface Step2Props {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const universities = ["NJIT", "Rutgers", "Northeastern", "Bucknell", "Villanova", "Wisconsin", "Brown", "UC Irvine", "UPenn"];
const majors = ["Computer Science", "Mechanical Engineering", "Biology", "Economics", "Math", "Psychology"];

export default function Step2({ data, onUpdate, onNext, onBack }: Step2Props) {
  const canContinue = true;

  // University TextInput + Filter
  const [univText, setUnivText] = useState(data.university || "");
  const [univOpen, setUnivOpen] = useState(false);
  const [filteredUnivs, setFilteredUnivs] = useState<string[]>(universities);

  useEffect(() => {
    const filtered = universities.filter((u) =>
      u.toLowerCase().includes(univText.toLowerCase())
    );
    setFilteredUnivs(filtered);
  }, [univText]);

  const selectUniversity = useCallback(
    (univ: string) => {
      setUnivText(univ);
      onUpdate({ university: univ });
      setUnivOpen(false);
    },
    [onUpdate]
  );

  // Major TextInput + Filter
  const [majorText, setMajorText] = useState(data.major || "");
  const [majorOpen, setMajorOpen] = useState(false);
  const [filteredMajors, setFilteredMajors] = useState<string[]>(majors);

  useEffect(() => {
    const filtered = majors.filter((m) =>
      m.toLowerCase().includes(majorText.toLowerCase())
    );
    setFilteredMajors(filtered);
  }, [majorText]);

  const selectMajor = useCallback(
    (major: string) => {
      setMajorText(major);
      onUpdate({ major });
      setMajorOpen(false);
    },
    [onUpdate]
  );

  // University Year Dropdown
  const [yearOpen, setYearOpen] = useState(false);
  const [yearValue, setYearValue] = useState<ProfileSetupData["university_year"] | null>(
    data.university_year ?? null
  );
  const yearItems: { label: string; value: ProfileSetupData["university_year"] }[] = [
    { label: "Freshman", value: "Freshman" },
    { label: "Sophomore", value: "Sophomore" },
    { label: "Junior", value: "Junior" },
    { label: "Senior", value: "Senior" },
    { label: "Graduate", value: "Graduate" },
  ];

  const handleYearChange = useCallback(
    (value: ProfileSetupData["university_year"] | null) => {
      setYearValue(value);
      if (value) onUpdate({ university_year: value });
    },
    [onUpdate]
  );

  // Graduation Year Dropdown
  const [gradOpen, setGradOpen] = useState(false);
  const gradItems: { label: string; value: number }[] = (() => {
    const now = new Date();
    const startYear = now.getFullYear();
    const endYear = 2030;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
      label: (startYear + i).toString(),
      value: startYear + i,
    }));
  })();
  const [gradValue, setGradValue] = useState<ProfileSetupData["grad_year"] | null>(
    data.grad_year ?? null
  );

  const handleGradChange = useCallback(
    (value: number | null) => {
      if (value !== null) {
        setGradValue(value);
        onUpdate({ grad_year: value });
      }
    },
    [onUpdate]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Academic Information</Text>
        <Text style={styles.subtitle}>Tell us about your studies</Text>
      </View>

      {/* University */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>University *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your university"
          placeholderTextColor={MUTED}
          value={univText}
          onChangeText={(text) => {
            setUnivText(text);
            setUnivOpen(true);
          }}
        />
        {univOpen && filteredUnivs.length > 0 && (
          <View style={styles.dropdownList}>
            {filteredUnivs.map((u) => (
              <TouchableOpacity key={u} onPress={() => selectUniversity(u)} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Major */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Major *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your major"
          placeholderTextColor={MUTED}
          value={majorText}
          onChangeText={(text) => {
            setMajorText(text);
            setMajorOpen(true);
          }}
        />
        {majorOpen && filteredMajors.length > 0 && (
          <View style={styles.dropdownList}>
            {filteredMajors.map((m) => (
              <TouchableOpacity key={m} onPress={() => selectMajor(m)} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* University Year */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>University Year *</Text>
        <DropDownPicker<ProfileSetupData["university_year"]>
          placeholder="Select your year"
          open={yearOpen}
          value={yearValue}
          items={yearItems}
          setOpen={setYearOpen}
          setValue={setYearValue as any}
          setItems={() => {}}
          listMode="SCROLLVIEW"
          onChangeValue={handleYearChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
        />
      </View>

      {/* Graduation Year */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Graduation Year *</Text>
        <DropDownPicker<number>
          placeholder="Select your graduation year"
          open={gradOpen}
          value={gradValue}
          items={gradItems}
          setOpen={setGradOpen}
          setValue={setGradValue as any}
          setItems={() => {}}
          listMode="SCROLLVIEW"
          onChangeValue={handleGradChange}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholderStyle={styles.placeholderStyle}
        />
      </View>

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
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
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
  dropdownList: {
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownText: { color: DARK, fontSize: 16 },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
  dropdown: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12, minHeight: 44, paddingHorizontal: 8, marginBottom: 8 },
  dropdownContainer: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12 },
  placeholderStyle: { color: MUTED, fontSize: 16, fontWeight: "400" },
});
