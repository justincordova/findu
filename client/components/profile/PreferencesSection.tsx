// React Native
import { StyleSheet, Text, View } from "react-native";

// Project imports
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Constants
const CONTAINER_MARGIN_BOTTOM = 24;
const CONTAINER_PADDING = 16;
const CONTAINER_BORDER_RADIUS = 16;
const CONTAINER_BACKGROUND = "#f9fafb";
const SHADOW_COLOR = "#000";
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 6;
const TITLE_FONT_SIZE = 20;
const TITLE_FONT_WEIGHT = "700";
const TITLE_MARGIN_BOTTOM = 12;
const ROW_PADDING_VERTICAL = 8;
const LABEL_FONT_SIZE = 16;
const LABEL_FONT_WEIGHT = "500";
const VALUE_FONT_SIZE = 16;
const VALUE_FONT_WEIGHT = "600";

/**
 * Preferences section showing user's dating preferences
 * Displays looking for intent, gender preference, age range, and sexual orientation
 */
export default function PreferencesSection() {
  const { data: profile } = useProfileSetupStore();

  const intent = profile?.intent || "";
  const genderPreference = Array.isArray(profile?.gender_preference)
    ? profile.gender_preference.filter(Boolean).map(String)
    : [];
  const minAge = profile?.min_age;
  const maxAge = profile?.max_age;
  const sexualOrientation = profile?.sexual_orientation || "";

  const getGenderPreferenceText = (): string => {
    if (genderPreference.length === 0) {
      return "Not set";
    }
    return genderPreference.join(", ");
  };

  const getAgeRangeText = (): string => {
    if (minAge == null && maxAge == null) {
      return "Not set";
    }

    const min = minAge != null ? String(minAge) : "?";
    const max = maxAge != null ? String(maxAge) : "?";

    if (min === "?" && max === "?") {
      return "Not set";
    }

    return `${min} - ${max}`;
  };

  const renderRow = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>

      {renderRow("Looking for:", intent || "Not set")}
      {renderRow("Gender preference:", getGenderPreferenceText())}
      {renderRow("Age range:", getAgeRangeText())}
      {renderRow("Sexual orientation:", sexualOrientation || "Not set")}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: CONTAINER_MARGIN_BOTTOM,
    padding: CONTAINER_PADDING,
    backgroundColor: CONTAINER_BACKGROUND,
    borderRadius: CONTAINER_BORDER_RADIUS,
    shadowColor: SHADOW_COLOR,
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    color: DARK,
    marginBottom: TITLE_MARGIN_BOTTOM,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: ROW_PADDING_VERTICAL,
  },
  label: {
    fontSize: LABEL_FONT_SIZE,
    color: MUTED,
    fontWeight: LABEL_FONT_WEIGHT,
    flex: 1,
  },
  value: {
    fontSize: VALUE_FONT_SIZE,
    color: DARK,
    fontWeight: VALUE_FONT_WEIGHT,
    textAlign: "right",
    flex: 1,
  },
});
