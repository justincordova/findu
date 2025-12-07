// React core
import { useCallback, useEffect, useMemo, useState } from "react";

// React Native
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Third-party
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";

// Project imports
import { BACKGROUND, DARK, MUTED, SECONDARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";
import { useConstantsStore } from "@/store/constantsStore";
import UniversityCard from "./UniversityCard";
import SearchableModal from "@/components/shared/SearchableModal";

// Types
interface Step3Props {
  onValidityChange?: (isValid: boolean) => void;
}

type DropdownKey =
  | "university_id"
  | "major"
  | "university_year"
  | "grad_year"
  | "campus_id"
  | null;

/**
 * Step 3: Academic information - university, major, year, and graduation year
 */
export default function Step3({ onValidityChange }: Step3Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);
  const { data, campuses } = useProfileSetupStore();
  const universityName = data?.university_name;
  const constants = useConstantsStore((state) => state.constants);

  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);

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
    return (constants?.majors ?? []).map((major) => ({
      label: major,
      value: major,
    }));
  }, [constants?.majors]);

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

      {/* University (read-only display) */}
      <UniversityCard universityName={universityName} />

      {/* Campus */}
      {campuses.length > 0 && (
        <View
          style={[styles.fieldContainer, { zIndex: getZIndex("campus_id", 3) }]}
        >
          <View style={styles.labelWithIcon}>
            <Text style={styles.label}>Campus</Text>
          </View>
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
            style={[
              styles.dropdown,
              profileData?.campus_id && { borderColor: SECONDARY, borderWidth: 2 },
            ]}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { maxHeight: screenHeight * 0.35 },
            ]}
          />
        </View>
      )}

      {/* Major */}
      <SearchableModal
        label="Major"
        value={profileData?.major ?? null}
        items={majorItems}
        onValueChange={(value) => setProfileField("major", value)}
        open={activeDropdown === "major"}
        onOpenChange={() => handleOpen("major")}
        placeholder="Select your major..."
        searchPlaceholder="Search majors..."
        noResultsText="No majors found"
        showCompleted={true}
        zIndex={2}
      />

      {/* University Year */}
      <View
        style={[
          styles.fieldContainer,
          { zIndex: getZIndex("university_year", 1) },
        ]}
      >
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Year</Text>
        </View>
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
          style={[
            styles.dropdown,
            profileData?.university_year ? { borderColor: SECONDARY, borderWidth: 2 } : undefined,
          ]}
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
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Graduation Year</Text>
        </View>
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
          style={[
            styles.dropdown,
            profileData?.grad_year ? { borderColor: SECONDARY, borderWidth: 2 } : undefined,
          ]}
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
  fieldContainer: { marginBottom: 24, position: "relative" },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 0,
    textAlign: "left",
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
