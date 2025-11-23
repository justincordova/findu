import React, { useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import RangeSlider from "rn-range-slider";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

export default function Step4({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
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
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Preferred Age Range</Text>
      <Text style={styles.subtitle}>
        Set the age range you are interested in
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Age Range</Text>
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
  fieldContainer: { marginBottom: 24 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  ageRangeContainer: { gap: 16 },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    textAlign: "center",
  },
  rangeSliderContainer: { paddingHorizontal: 8 },
  sliderBox: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSlider: { width: "100%", height: 20 },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  railBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  railSelected: { height: 4, borderRadius: 2, backgroundColor: PRIMARY },
  sliderDescription: { fontSize: 12, color: MUTED, textAlign: "center" },
});
