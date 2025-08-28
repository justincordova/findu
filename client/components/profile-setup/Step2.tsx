import React, { useMemo, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

interface Step2Props {
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey =
  | "university"
  | "major"
  | "university_year"
  | "grad_year"
  | null;

export default function Step2({ onValidityChange }: Step2Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const screenHeight = Dimensions.get("window").height;
  const emptyCallback = useCallback(() => {}, []);

  const isValid = useMemo(
    () =>
      !!profileData?.university &&
      !!profileData?.major &&
      !!profileData?.university_year &&
      !!profileData?.grad_year,
    [profileData]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const universityItems: ItemType<string>[] = useMemo(
    () => [
      { label: "Northeastern University", value: "Northeastern University" },
      { label: "Boston University", value: "Boston University" },
      { label: "MIT", value: "MIT" },
      { label: "Harvard University", value: "Harvard University" },
      { label: "Tufts University", value: "Tufts University" },
      { label: "Boston College", value: "Boston College" },
      { label: "UMass Boston", value: "UMass Boston" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const majorItems: ItemType<string>[] = useMemo(
    () => [
      { label: "Computer Science", value: "Computer Science" },
      { label: "Engineering", value: "Engineering" },
      { label: "Business", value: "Business" },
      { label: "Psychology", value: "Psychology" },
      { label: "Biology", value: "Biology" },
      { label: "Mathematics", value: "Mathematics" },
      { label: "Economics", value: "Economics" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const universityYearItems: ItemType<string>[] = useMemo(
    () => [
      { label: "Freshman", value: "1" },
      { label: "Sophomore", value: "2" },
      { label: "Junior", value: "3" },
      { label: "Senior", value: "4" },
      { label: "Graduate", value: "5" },
    ],
    []
  );

  const gradYearItems: ItemType<string>[] = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const year = new Date().getFullYear() + i;
        return { label: `${year}`, value: `${year}` };
      }),
    []
  );

  const handleOpen = (key: DropdownKey) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const getZIndex = (key: DropdownKey, baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Education</Text>
      <Text style={styles.subtitle}>
        Tell us about your academic background
      </Text>

      {/* University */}
      <View
        style={[styles.fieldContainer, { zIndex: getZIndex("university", 4) }]}
      >
        <Text style={styles.label}>University *</Text>
        <DropDownPicker<string>
          placeholder="Select your university"
          open={activeDropdown === "university"}
          value={profileData?.university ?? null}
          items={universityItems}
          setOpen={() => handleOpen("university")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(profileData?.university ?? "")
                : callback;
            setField("university", value ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.35 },
          ]}
        />
      </View>

      {/* Major */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("major", 3) }]}>
        <Text style={styles.label}>Major *</Text>
        <DropDownPicker<string>
          placeholder="Select your major"
          open={activeDropdown === "major"}
          value={profileData?.major ?? null}
          items={majorItems}
          setOpen={() => handleOpen("major")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(profileData?.major ?? "")
                : callback;
            setField("major", value ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.35 },
          ]}
        />
      </View>

      {/* University Year */}
      <View
        style={[
          styles.fieldContainer,
          { zIndex: getZIndex("university_year", 2) },
        ]}
      >
        <Text style={styles.label}>Year *</Text>
        <DropDownPicker<string>
          placeholder="Select your year"
          open={activeDropdown === "university_year"}
          value={
            profileData?.university_year !== undefined
              ? String(profileData.university_year)
              : null
          }
          items={universityYearItems}
          setOpen={() => handleOpen("university_year")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(
                    profileData?.university_year
                      ? String(profileData.university_year)
                      : ""
                  )
                : callback;
            setField("university_year", value ? parseInt(value) : 0);
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.35 },
          ]}
        />
      </View>

      {/* Graduation Year */}
      <View
        style={[styles.fieldContainer, { zIndex: getZIndex("grad_year", 1) }]}
      >
        <Text style={styles.label}>Graduation Year *</Text>
        <DropDownPicker<string>
          placeholder="Select graduation year"
          open={activeDropdown === "grad_year"}
          value={
            profileData?.grad_year !== undefined
              ? String(profileData.grad_year)
              : null
          }
          items={gradYearItems}
          setOpen={() => handleOpen("grad_year")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(
                    profileData?.grad_year ? String(profileData.grad_year) : ""
                  )
                : callback;
            setField("grad_year", value ? parseInt(value) : 0);
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { maxHeight: screenHeight * 0.35 },
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
