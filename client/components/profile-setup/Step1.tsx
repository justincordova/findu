import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { DARK, MUTED, BACKGROUND, DANGER } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

interface Step1Props {
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey = "gender" | "pronouns" | null;

export default function Step1({ onValidityChange }: Step1Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);

  const screenHeight = Dimensions.get("window").height;

  /** Max birthdate = today minus 18 years */
  const maxBirthdate = useMemo(() => {
    const today = new Date();
    return new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
  }, []);

  /** Validity check */
  const isValid = useMemo(() => {
    const nameValid = (profileData?.name ?? "").trim() !== "";
    const birthValid = profileData?.birthdate
      ? new Date(profileData.birthdate) <= maxBirthdate
      : false;
    const genderValid = (profileData?.gender ?? "") !== "";
    const pronounValid = (profileData?.pronouns ?? "") !== "";
    return nameValid && birthValid && genderValid && pronounValid;
  }, [profileData, maxBirthdate]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /** Dropdown items */
  const genderItems = useMemo(
    () => [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const pronounItems = useMemo(
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

  const emptyCallback = useCallback(() => {}, []);

  const handleOpen = (key: DropdownKey) =>
    setActiveDropdown((prev) => (prev === key ? null : key));
  const getZIndex = (key: DropdownKey, baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  /** Date picker handlers */
  const handleDateConfirm = (date: Date) => {
    if (date > maxBirthdate) {
      setBirthdateError("You must be at least 18 years old");
    } else {
      setBirthdateError(null);
      setField("birthdate", date.toISOString());
    }
    setShowDatePicker(false);
  };

  const handleDatePickerOpen = () => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Information</Text>
      <Text style={styles.subtitle}>
        Please enter your name, birthdate, gender, and pronouns
      </Text>

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor={MUTED}
          value={profileData?.name ?? ""}
          onChangeText={(text) => setField("name", text)}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit
        />
      </View>

      {/* Birthdate */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Birthdate *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={handleDatePickerOpen}
        >
          <Text
            style={[
              styles.datePickerText,
              !profileData?.birthdate && { color: MUTED },
            ]}
          >
            {profileData?.birthdate
              ? new Date(profileData.birthdate).toLocaleDateString()
              : "Select your birthdate"}
          </Text>
        </TouchableOpacity>
        {birthdateError && (
          <Text style={styles.errorText}>{birthdateError}</Text>
        )}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={
            profileData?.birthdate
              ? new Date(profileData.birthdate)
              : maxBirthdate
          }
          maximumDate={maxBirthdate}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
      </View>

      {/* Gender */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("gender", 2) }]}>
        <Text style={styles.label}>Gender *</Text>
        <DropDownPicker<string>
          placeholder="Select your gender"
          open={activeDropdown === "gender"}
          value={profileData?.gender ?? ""}
          items={genderItems}
          setOpen={() => handleOpen("gender")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData?.gender ?? "")
                : callback;
            setField("gender", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.4 },
          ]}
        />
      </View>

      {/* Pronouns */}
      <View
        style={[styles.fieldContainer, { zIndex: getZIndex("pronouns", 1) }]}
      >
        <Text style={styles.label}>Pronouns *</Text>
        <DropDownPicker<string>
          placeholder="Select your pronouns"
          open={activeDropdown === "pronouns"}
          value={profileData?.pronouns ?? ""}
          items={pronounItems}
          setOpen={() => handleOpen("pronouns")}
          setValue={(callback) => {
            const val =
              typeof callback === "function"
                ? callback(profileData?.pronouns ?? "")
                : callback;
            setField("pronouns", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.4 },
          ]}
          dropDownDirection="TOP" // opens upward
        />
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
  input: {
    width: "100%",
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
    color: DARK,
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerText: { fontSize: 16, color: DARK },
  errorText: { color: DANGER, marginTop: 4, fontSize: 14, textAlign: "center" },
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
