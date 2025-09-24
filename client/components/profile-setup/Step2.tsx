import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";
import { useAuthStore } from "../../store/authStore";
import { profileApi } from "@/api/profile";

interface Step2Props {
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

export default function Step2({ onBack, onValidityChange }: Step2Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setField = useProfileSetupStore((state) => state.setField);
  const email = useAuthStore((state) => state.email);
  const { data } = useProfileSetupStore();
  const universityName = data?.university_name;

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [campusItems, setCampusItems] = useState<ItemType<string>[]>([]);
  const [loadingCampus, setLoadingCampus] = useState(false);

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

  // Fetch university/campuses using auth email
  useEffect(() => {
    const fetchUniversityData = async () => {
      if (!email) return;

      try {
        setLoadingCampus(true);

        const { university, campuses } = await profileApi.domainMap(email);

        // Store the university id and name
        setField("university_id", university.id);
        setField("university_name", university.name);

        if (campuses.length > 0) {
          // Prepare items for the dropdown
          setCampusItems(campuses.map((c) => ({ label: c.name, value: c.id })));

          // Set default campus if not already selected
          const defaultCampus = campuses[0];
          if (!profileData?.campus_id) {
            setField("campus_id", defaultCampus.id);
          }

          // Store campus name in the store
          setField("campus_name", defaultCampus.name);
        }
      } catch (err) {
        console.error("Error fetching university data:", err);
      } finally {
        setLoadingCampus(false);
      }
    };

    fetchUniversityData();
  }, [email, profileData?.campus_id, setField]);

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
        {loadingCampus ? (
          <ActivityIndicator size="small" color={DARK} />
        ) : (
          <View style={styles.universityDisplay}>
            <Text style={styles.universityText}>
              {universityName || "No university found"}
            </Text>
          </View>
        )}
      </View>

      {/* Campus */}
      {campusItems.length > 0 && (
        <View
          style={[styles.fieldContainer, { zIndex: getZIndex("campus_id", 3) }]}
        >
          <Text style={styles.label}>Campus *</Text>
          <DropDownPicker<string>
            open={activeDropdown === "campus_id"}
            value={profileData?.campus_id ?? null}
            items={campusItems}
            setOpen={() => handleOpen("campus_id")}
            setValue={(callback) => {
              const value =
                typeof callback === "function"
                  ? callback(profileData?.campus_id ?? "")
                  : callback;
              setField("campus_id", value ?? "");
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
        <DropDownPicker<string>
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
            setField("grad_year", value ? parseInt(value) : 0);
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
  backButton: { marginBottom: 24 },
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
});
