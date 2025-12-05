import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";
import { useConstantsStore } from "../../store/constantsStore";

interface Step3Props {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey =
  | "university_id"
  | "major"
  | "university_year"
  | "grad_year"
  | "campus_id"
  | null;

export default function Step3({ onBack, onValidityChange }: Step3Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);
  const { data, campuses } = useProfileSetupStore();
  const universityName = data?.university_name;
  const constants = useConstantsStore((state) => state.constants);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [majorSearch, setMajorSearch] = useState("");

  const screenHeight = Dimensions.get("window").height;
  const emptyCallback = useCallback(() => {}, []);

  const isValid = useMemo(
    () =>
      !!profileData?.university_id &&
      !!profileData?.major &&
      !!profileData?.university_year &&
      !!profileData?.grad_year,
    [profileData]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

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

  const majorItems: ItemType<string>[] = useMemo(() => {
    const filteredMajors = constants?.majors?.filter((major) =>
      major.toLowerCase().includes(majorSearch.toLowerCase())
    ) ?? [];

    return filteredMajors.map((major) => ({
      label: major,
      value: major,
    }));
  }, [constants?.majors, majorSearch]);

  const handleOpen = (key: DropdownKey) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const getZIndex = (key: DropdownKey, baseZ: number) =>
    activeDropdown === key ? 5000 : baseZ;

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Education</Text>
      <Text style={styles.subtitle}>
        Tell us about your academic background
      </Text>

      {/* University (read-only display) */}
      <View
        style={[
          styles.fieldContainer,
          { zIndex: getZIndex("university_id", 4) },
        ]}
      >
        <Text style={styles.label}>University *</Text>
        <View style={styles.universityDisplay}>
          <Text style={styles.universityText}>
            {universityName || "No university found"}
          </Text>
        </View>
      </View>

      {/* Campus */}
      {campuses.length > 0 && (
        <View
          style={[styles.fieldContainer, { zIndex: getZIndex("campus_id", 3) }]}
        >
          <Text style={styles.label}>Campus *</Text>
          <DropDownPicker<string>
            open={activeDropdown === "campus_id"}
            value={profileData?.campus_id ?? null}
            items={campuses}
            setOpen={() => handleOpen("campus_id")}
            setValue={(callback) => {
              const value =
                typeof callback === "function"
                  ? callback(profileData?.campus_id ?? "")
                  : callback;
              setProfileField("campus_id", value ?? "");
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
      )}

      {/* Major */}
      <View style={[styles.fieldContainer, { zIndex: getZIndex("major", 2) }]}>
        <Text style={styles.label}>Major *</Text>
        {activeDropdown === "major" && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={MUTED} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search majors..."
              placeholderTextColor={MUTED}
              value={majorSearch}
              onChangeText={setMajorSearch}
            />
          </View>
        )}
        <DropDownPicker<string>
          open={activeDropdown === "major"}
          value={profileData?.major ?? null}
          items={majorItems}
          setOpen={() => {
            handleOpen("major");
            if (!activeDropdown) setMajorSearch("");
          }}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(profileData?.major ?? "")
                : callback;
            setProfileField("major", value ?? "");
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
          { zIndex: getZIndex("university_year", 1) },
        ]}
      >
        <Text style={styles.label}>Year *</Text>
        <DropDownPicker<string>
          open={activeDropdown === "university_year"}
          value={
            profileData?.university_year
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
            setProfileField("university_year", value ? parseInt(value) : 0);
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
        style={[styles.fieldContainer, { zIndex: getZIndex("grad_year", 0) }]}
      >
        <Text style={styles.label}>Graduation Year *</Text>
        <DropDownPicker<string>
          open={activeDropdown === "grad_year"}
          value={profileData?.grad_year ? String(profileData.grad_year) : null}
          items={Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() + i;
            return { label: `${year}`, value: `${year}` };
          })}
          setOpen={() => handleOpen("grad_year")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(
                    profileData?.grad_year ? String(profileData.grad_year) : ""
                  )
                : callback;
            setProfileField("grad_year", value ? parseInt(value) : 0);
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
  backButton: {
    position: "absolute",
    top: 48,
    left: 24,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 80,
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
  universityDisplay: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#eef2f5",
    borderRadius: 16,
    borderColor: "#d1d5db",
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  universityText: {
    fontSize: 16,
    color: DARK,
    fontWeight: "500",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: DARK,
  },
});
