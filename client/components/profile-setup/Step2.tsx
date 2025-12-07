// React core
import { useCallback, useEffect, useMemo, useState } from "react";

// React Native
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Project imports
import { BACKGROUND, DANGER, DARK, MUTED, SECONDARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Types
interface Step2Props {
  onNext?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey = "gender" | "pronouns" | null;

/**
 * Step 2: Personal information - name, gender, pronouns, and birthdate
 */
export default function Step2({ onNext, onValidityChange }: Step2Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

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
      setProfileField("birthdate", date.toISOString());
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
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>First Name</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            profileData?.name?.trim() && styles.inputCompleted,
          ]}
          placeholder="Enter your first name"
          placeholderTextColor={MUTED}
          value={profileData?.name ?? ""}
          onChangeText={(text) => setProfileField("name", text)}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit
        />
      </View>

      {/* Birthdate */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Birthdate</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            profileData?.birthdate && styles.datePickerButtonCompleted,
          ]}
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
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Gender</Text>
        </View>
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
            setProfileField("gender", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={[
            styles.dropdown,
            profileData?.gender && { borderColor: SECONDARY, borderWidth: 2 },
          ]}
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
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Pronouns</Text>
        </View>
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
            setProfileField("pronouns", val ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={[
            styles.dropdown,
            profileData?.pronouns && { borderColor: SECONDARY, borderWidth: 2 },
          ]}
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
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  fieldContainer: { marginBottom: 22, position: "relative" },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK,
    marginBottom: 0,
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: DARK,
  },
  inputCompleted: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },
  datePickerButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  datePickerButtonCompleted: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },
  datePickerText: {
    fontSize: 16,
    color: DARK,
    fontWeight: "500",
  },
  errorText: {
    color: DANGER,
    marginTop: 6,
    fontSize: 13,
    textAlign: "left",
    fontWeight: "500",
  },
  dropdown: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 0,
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
  },
});
