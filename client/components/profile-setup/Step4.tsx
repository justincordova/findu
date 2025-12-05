import React, { useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";
import AgeRangeSlider from "../shared/AgeRangeSlider";

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
        <AgeRangeSlider
          minAge={profileData?.min_age ?? 18}
          maxAge={profileData?.max_age ?? 26}
          onAgeRangeChange={handleSliderChange}
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
  fieldContainer: { marginBottom: 24 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
});
