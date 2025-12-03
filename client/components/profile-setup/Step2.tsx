import React, { useMemo, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";
import { useAuthStore } from "../../store/authStore";
import { profileApi } from "../../api/profile";
import logger from "../../config/logger";

interface Step2Props {
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey =
  | "university"
  | "campus"
  | "major"
  | "university_year"
  | "grad_year"
  | null;

export default function Step2({ onValidityChange }: Step2Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);
  const userEmail = useAuthStore((state) => state.userEmail);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [universityItems, setUniversityItems] = useState<ItemType<string>[]>([]);
  const [campusItems, setCampusItems] = useState<ItemType<string>[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [isLoadingUniversity, setIsLoadingUniversity] = useState(false);
  const [detectedUniversity, setDetectedUniversity] = useState<any>(null);
  
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

  // Auto-detect university from email on component mount
  useEffect(() => {
    const detectUniversityFromEmail = async () => {
      if (!userEmail) return;
      
      setIsLoadingUniversity(true);
      try {
        logger.info("Detecting university from email", { email: userEmail });
        const result = await profileApi.getUniversityFromEmail(userEmail);
        
        if (result && result.id) {
          setDetectedUniversity(result);
          
          // Set the university ID in store (not the name)
          setField("university_id", result.id);
          
          // Set the detected university in the dropdown
          const universityOption = {
            label: result.name,
            value: result.id  // Store ID as value
          };
          setUniversityItems([universityOption]);
          
          // Fetch campuses for this university
          try {
            const campuses = await profileApi.getCampusesByUniversity(result.id);
            if (campuses && campuses.length > 1) {
              const campusOptions = campuses.map((campus: any) => ({
                label: campus.name,
                value: campus.id
              }));
              setCampusItems(campusOptions);
            } else if (campuses && campuses.length === 1) {
              // Auto-select if only one campus
              setField("campus_id", campuses[0].id);
              setSelectedCampus(campuses[0].id);
              logger.info("Single campus auto-selected", { campus: campuses[0].name });
            } else {
              // No campuses, set to null
              setField("campus_id", null);
            }
          } catch (campusError) {
            logger.warn("Could not fetch campuses", { error: campusError });
            setField("campus_id", null);
          }
          
          logger.info("University auto-detected", { 
            university: result.name,
            universityId: result.id
          });
        }
      } catch (error) {
        logger.warn("Could not detect university from email", { error, email: userEmail });
        // Fallback to default list - note: these won't work without real IDs
        setUniversityItems([
          { label: "Northeastern University", value: "neu-id" },
          { label: "Boston University", value: "bu-id" },
          { label: "MIT", value: "mit-id" },
          { label: "Harvard University", value: "harvard-id" },
          { label: "Tufts University", value: "tufts-id" },
          { label: "Boston College", value: "bc-id" },
          { label: "UMass Boston", value: "umass-id" },
          { label: "Other", value: "other-id" },
        ]);
      } finally {
        setIsLoadingUniversity(false);
      }
    };

    detectUniversityFromEmail();
  }, [userEmail, setField]);

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
        style={[styles.fieldContainer, { zIndex: getZIndex("university", 5) }]}
      >
        <Text style={styles.label}>University *</Text>
        <DropDownPicker<string>
          placeholder="Select your university"
          open={activeDropdown === "university"}
          value={profileData?.university_id ?? null}
          items={universityItems}
          setOpen={() => handleOpen("university")}
          setValue={(callback) => {
            const value =
              typeof callback === "function"
                ? callback(profileData?.university_id ?? "")
                : callback;
            setField("university_id", value ?? "");
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

      {/* Campus Selection - Only show if multiple campuses detected */}
      {campusItems.length > 1 && (
        <View
          style={[styles.fieldContainer, { zIndex: getZIndex("campus", 4) }]}
        >
          <Text style={styles.label}>Campus *</Text>
          <DropDownPicker<string>
            placeholder="Select your campus"
            open={activeDropdown === "campus"}
            value={selectedCampus}
            items={campusItems}
            setOpen={() => handleOpen("campus")}
            setValue={(callback) => {
              const value =
                typeof callback === "function"
                  ? callback(selectedCampus ?? "")
                  : callback;
              setSelectedCampus(value);
              setField("campus_id", value);  // Save to store
              logger.info("Campus selected", { campusId: value });
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
