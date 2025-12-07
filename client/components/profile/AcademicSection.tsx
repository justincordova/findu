// React Native
import { StyleSheet, Text, View } from "react-native";

// Project imports
import { DARK, MUTED } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Constants
const YEAR_MAP: Record<number, string> = {
  1: "Freshman",
  2: "Sophomore",
  3: "Junior",
  4: "Senior",
  5: "Grad",
};
const CONTAINER_MARGIN_BOTTOM = 24;
const CONTAINER_PADDING = 16;
const CONTAINER_BORDER_RADIUS = 12;
const CONTAINER_BACKGROUND = "#f9fafb";
const SHADOW_COLOR = "#000";
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 6;
const TITLE_FONT_SIZE = 20;
const TITLE_FONT_WEIGHT = "700";
const TITLE_MARGIN_BOTTOM = 12;
const ROW_PADDING_VERTICAL = 8;
const LABEL_FONT_SIZE = 14;
const LABEL_FONT_WEIGHT = "600";
const VALUE_FONT_SIZE = 16;
const VALUE_FONT_WEIGHT = "500";

/**
 * Academic info section displaying university, year, major, and graduation year
 * Formats year using YEAR_MAP for readable display
 */
export default function AcademicSection() {
  const { data: profile } = useProfileSetupStore();

  const university = profile?.university_name || "";
  const universityYear = profile?.university_year;
  const major = profile?.major || "";
  const gradYear = profile?.grad_year;

  const getYearText = (): string => {
    if (universityYear == null) return "Not set";
    const yearText = YEAR_MAP[universityYear];
    return yearText || "Unknown";
  };

  const getGradYearText = (): string => {
    if (gradYear == null) return "Not set";
    return String(gradYear);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic Info</Text>

      <View style={styles.row}>
        <Text style={styles.label}>University:</Text>
        <Text style={styles.value}>{university || "Not set"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Year:</Text>
        <Text style={styles.value}>{getYearText()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Major:</Text>
        <Text style={styles.value}>{major || "Not set"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Graduation Year:</Text>
        <Text style={styles.value}>{getGradYearText()}</Text>
      </View>
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
    fontWeight: LABEL_FONT_WEIGHT,
    color: MUTED,
    flex: 1,
  },
  value: {
    fontSize: VALUE_FONT_SIZE,
    fontWeight: VALUE_FONT_WEIGHT,
    color: DARK,
    flex: 1,
    textAlign: "right",
  },
});
