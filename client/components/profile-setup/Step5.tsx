// React core
import { useCallback, useEffect, useMemo } from "react";

// React Native
import { StyleSheet, Text, View } from "react-native";

// Third-party
import RangeSlider from "rn-range-slider";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Types
interface Step5Props {
  onValidityChange?: (isValid: boolean) => void;
}

/**
 * Step 5: Gender preferences - select preferred genders
 */
export default function Step5({
  onValidityChange,
}: Step5Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  /** Slider change handler */
  const handleSliderChange = useCallback(
    (low: number, high: number) => {
      setProfileField("min_age", low);
      setProfileField("max_age", high);
    },
    [setProfileField]
  );

  /** Validity check */
  const isValid = useMemo(
    () =>
      typeof profileData?.min_age === "number" &&
      typeof profileData?.max_age === "number" &&
      profileData?.min_age > 0 &&
      profileData?.max_age > 0 &&
      profileData?.min_age <= profileData?.max_age,
    [profileData?.min_age, profileData?.max_age]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /** Slider render functions */
  const renderThumb = useCallback(() => <View style={styles.thumb} />, []);
  const renderRail = useCallback(
    () => <View style={styles.railBackground} />,
    []
  );
  const renderRailSelected = useCallback(
    () => <View style={styles.railSelected} />,
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferred Age Range</Text>
      <Text style={styles.subtitle}>
        Set the age range you are interested in
      </Text>

      <View style={styles.fieldContainer}>
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>Age Range</Text>
        </View>
        <View style={styles.ageRangeContainer}>
          <Text style={styles.ageRangeDisplay}>
            {profileData?.min_age ?? 18} - {profileData?.max_age ?? 26} years
            old
          </Text>
          <View style={styles.rangeSliderContainer}>
            <View style={styles.sliderBox}>
              <RangeSlider
                style={styles.rangeSlider}
                min={18}
                max={26}
                step={1}
                low={Number(profileData?.min_age ?? 18)} // <-- coerce to number
                high={Number(profileData?.max_age ?? 26)} // <-- coerce to number
                onValueChanged={handleSliderChange}
                renderThumb={renderThumb}
                renderRail={renderRail}
                renderRailSelected={renderRailSelected}
              />
            </View>
            <Text style={styles.sliderDescription}>
              Drag the handles to set your preferred age range
            </Text>
          </View>
        </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 36,
    textAlign: "center",
    lineHeight: 22,
  },
  fieldContainer: { marginBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK,
    marginBottom: 16,
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ageRangeContainer: { gap: 20 },
  ageRangeDisplay: {
    fontSize: 32,
    fontWeight: "700",
    color: PRIMARY,
    textAlign: "center",
  },
  rangeSliderContainer: { paddingHorizontal: 0 },
  sliderBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSlider: { width: "100%", height: 24 },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  railBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    width: "100%",
  },
  railSelected: { height: 6, borderRadius: 3, backgroundColor: PRIMARY },
  sliderDescription: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    fontWeight: "500",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
});
