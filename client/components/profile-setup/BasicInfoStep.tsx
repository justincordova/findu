import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { ProfileSetupData } from "../../app/profile-setup/[step]";
import DropDownPicker from "react-native-dropdown-picker";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface BasicInfoStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BasicInfoStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: BasicInfoStepProps) {
  // const canContinue = Boolean(
  //   data.name &&
  //   data.age &&
  //   data.gender &&
  //   data.school &&
  //   data.major &&
  //   data.schoolYear &&
  //   data.gradYear
  // );
  const canContinue = true;

  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState(data.gender ?? null);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "Other", value: "Other" },
  ]);

  const handleGenderChange = (value: string | null) => {
    if (value) {
      setGenderValue(value as ProfileSetupData["gender"]);
      onUpdate({ gender: value as ProfileSetupData["gender"] });
    } else {
      setGenderValue(null);
      onUpdate({ gender: null });
    }
  };

  const [yearOpen, setYearOpen] = useState(false);
  const [yearValue, setYearValue] = useState(data.schoolYear ?? null);
  const [yearItems, setYearItems] = useState([
    { label: "Freshman", value: "Freshman" },
    { label: "Sophomore", value: "Sophomore" },
    { label: "Junior", value: "Junior" },
    { label: "Senior", value: "Senior" },
    { label: "Graduate", value: "Graduate" },
  ]);

  const handleYearChange = (value: string | null) => {
    if (value) {
      setYearValue(value as ProfileSetupData["schoolYear"]);
      onUpdate({ schoolYear: value as ProfileSetupData["schoolYear"] });
    } else {
      setYearValue(null);
      onUpdate({ schoolYear: null });
    }
  };

  const [gradOpen, setGradOpen] = useState(false);
  const [gradValue, setGradValue] = useState(data.gradYear ?? null);
  const getGradYears = () => {
    const baseStart = 2025;
    const baseEnd = 2030;
    const now = new Date();
    let year = now.getFullYear();
    if (now.getMonth() > 5) year++;
    let years = [];
    for (let y = baseStart; y <= baseEnd; y++) {
      years.push(String(y));
    }
    if (year > baseEnd) {
      years.push(String(year));
    }
    return years.map((y) => ({ label: y, value: y }));
  };
  const [gradItems, setGradItems] = useState(getGradYears());

  const handleGradChange = (value: string | null) => {
    if (value) {
      setGradValue(value as ProfileSetupData["gradYear"]);
      onUpdate({ gradYear: value as ProfileSetupData["gradYear"] });
    } else {
      setGradValue(null);
      onUpdate({ gradYear: null });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={MUTED}
            value={data.name}
            onChangeText={(text) => onUpdate({ name: text })}
            maxLength={50}
          />
        </View>

        {/* Age */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor={MUTED}
            value={data.age ? data.age.toString() : ""}
            onChangeText={(text) => onUpdate({ age: parseInt(text) || 0 })}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Gender *</Text>
          <DropDownPicker
            placeholder="Enter your gender"
            open={genderOpen}
            value={genderValue}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={setGenderValue}
            setItems={setGenderItems}
            listMode="SCROLLVIEW"
            onChangeValue={handleGenderChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            placeholderStyle={{
              color: MUTED,
              fontSize: 16,
              fontWeight: "400",
            }}
          />
        </View>

        {/* School */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>University/School *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your university name"
            placeholderTextColor={MUTED}
            value={data.school}
            onChangeText={(text) => onUpdate({ school: text })}
            maxLength={100}
          />
        </View>

        {/* Campus */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Campus</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Main Campus, Boston Campus"
            placeholderTextColor={MUTED}
            value={data.campus}
            onChangeText={(text) => onUpdate({ campus: text })}
            maxLength={100}
          />
        </View>

        {/* Major */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Major *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your major"
            placeholderTextColor={MUTED}
            value={data.major}
            onChangeText={(text) => onUpdate({ major: text })}
            maxLength={100}
          />
        </View>

        {/* School Year */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>School Year *</Text>
          <DropDownPicker
            placeholder="Enter your school year"
            open={yearOpen}
            value={yearValue}
            items={yearItems}
            setOpen={setYearOpen}
            setValue={setYearValue}
            setItems={setYearItems}
            listMode="SCROLLVIEW"
            onChangeValue={handleYearChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            placeholderStyle={styles.placeholderStyle}
          />
        </View>

        {/* Grad Year */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Graduation Year *</Text>
          <DropDownPicker
            placeholder="Enter your graduation year"
            open={gradOpen}
            value={gradValue}
            items={gradItems}
            setOpen={setGradOpen}
            setValue={setGradValue}
            setItems={setGradItems}
            listMode="SCROLLVIEW"
            onChangeValue={handleGradChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            placeholderStyle={styles.placeholderStyle}
          />
        </View>
      </ScrollView>

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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
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
    textAlign: "center",
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
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
  pickerContainer: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  picker: {
    height: 50,
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: MUTED,
  },
  dropdown: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
    zIndex: 2000,
  },
  dropdownContainer: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    zIndex: 2000,
  },
  placeholderStyle: {
    color: MUTED,
    fontSize: 16,
    fontWeight: "400",
  },
});
