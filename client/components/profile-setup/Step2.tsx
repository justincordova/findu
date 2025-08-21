import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileSetupStore";

const universities = [
  "NJIT", "Rutgers", "Northeastern", "Bucknell", "Villanova", "Wisconsin", "Brown", "UC Irvine", "UPenn"
];
const majors = ["Computer Science", "Mechanical Engineering", "Biology", "Economics", "Math", "Psychology"];
const years = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

interface Step2Props {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey = "univ" | "major" | "year" | "grad" | null;

export default function Step2({ onBack, onValidityChange }: Step2Props) {
  const profileData = useProfileSetupStore(state => state.data);
  const setField = useProfileSetupStore(state => state.setField);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);

  const univItems: ItemType<string>[] = useMemo(() => universities.map(u => ({ label: u, value: u })), []);
  const majorItems: ItemType<string>[] = useMemo(() => majors.map(m => ({ label: m, value: m })), []);
  const yearItems: ItemType<string>[] = useMemo(() => years.map(y => ({ label: y, value: y })), []);
  const gradItems: ItemType<string>[] = useMemo(() => {
    const startYear = new Date().getFullYear();
    return Array.from({ length: 2030 - startYear + 1 }, (_, i) => ({ label: String(startYear + i), value: String(startYear + i) }));
  }, []);

  const isValid = useMemo(
    () => !!profileData.university && !!profileData.major && !!profileData.university_year && !!profileData.grad_year,
    [profileData]
  );

  useEffect(() => { onValidityChange?.(isValid); }, [isValid, onValidityChange]);

  const handleOpen = (key: DropdownKey) => setActiveDropdown(prev => (prev === key ? null : key));
  const getZIndex = (key: DropdownKey, baseZ: number) => (activeDropdown === key ? 5000 : baseZ);
  const emptyCallback = useCallback(() => {}, []);
  const screenHeight = Dimensions.get("window").height;

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>University Info</Text>
      <Text style={styles.subtitle}>Tell us about your school and major</Text>

      {/* University */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("univ", 4000) }]}>
        <Text style={styles.label}>University *</Text>
        <DropDownPicker<string>
          placeholder="Select your university"
          open={activeDropdown === "univ"}
          value={profileData.university ?? ""}
          items={univItems}
          setOpen={() => handleOpen("univ")}
          setValue={val => {
            const value = typeof val === "function" ? val(profileData.university ?? "") : val;
            setField("university", value ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[styles.dropdownContainer, { position: "absolute", zIndex: getZIndex("univ", 4000) }]}
        />
      </View>

      {/* Major */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("major", 3000) }]}>
        <Text style={styles.label}>Major *</Text>
        <DropDownPicker<string>
          placeholder="Select your major"
          open={activeDropdown === "major"}
          value={profileData.major ?? ""}
          items={majorItems}
          setOpen={() => handleOpen("major")}
          setValue={val => {
            const value = typeof val === "function" ? val(profileData.major ?? "") : val;
            setField("major", value ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[styles.dropdownContainer, { position: "absolute", zIndex: getZIndex("major", 3000) }]}
        />
      </View>

      {/* University Year */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("year", 2000) }]}>
        <Text style={styles.label}>University Year *</Text>
        <DropDownPicker<string>
          placeholder="Select your year"
          open={activeDropdown === "year"}
          value={profileData.university_year ?? ""}
          items={yearItems}
          setOpen={() => handleOpen("year")}
          setValue={val => {
            const value = typeof val === "function" ? val(profileData.university_year ?? "") : val;
            setField("university_year", value ?? "");
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          style={styles.dropdown}
          dropDownContainerStyle={[styles.dropdownContainer, { position: "absolute", zIndex: getZIndex("year", 2000) }]}
        />
      </View>

      {/* Graduation Year */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("grad", 1000) }]}>
        <Text style={styles.label}>Graduation Year *</Text>
        <DropDownPicker<string>
          placeholder="Select your graduation year"
          open={activeDropdown === "grad"}
          value={profileData.grad_year ? String(profileData.grad_year) : ""}
          items={gradItems}
          setOpen={() => handleOpen("grad")}
          setValue={val => {
            const value = typeof val === "function" ? val(profileData.grad_year ? String(profileData.grad_year) : "") : val;
            setField("grad_year", parseInt(value!, 10));
          }}
          setItems={emptyCallback}
          listMode="SCROLLVIEW"
          maxHeight={screenHeight * 0.4} // Only grad year dropdown scrollable if too tall
          style={styles.dropdown}
          dropDownContainerStyle={[styles.dropdownContainer, { position: "absolute", zIndex: getZIndex("grad", 1000) }]}
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
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, marginBottom: 32, textAlign: "center" },
  fieldContainer: { marginBottom: 24, position: "relative" },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
  dropdown: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12, minHeight: 44, paddingHorizontal: 8, marginBottom: 8 },
  dropdownContainer: { backgroundColor: BACKGROUND, borderColor: "#e5e7eb", borderRadius: 12 },
});
