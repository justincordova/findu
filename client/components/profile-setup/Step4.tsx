import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import RangeSlider from "rn-range-slider";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

interface Step4Props {
  data: ProfileSetupData; // Current profile data from parent
  onUpdate: (data: Partial<ProfileSetupData>) => void; // Callback to update parent state
  onNext: () => void; // Callback to move to next step
}

export default function Step4({ data, onUpdate, onNext }: Step4Props) {
  const navigation = useNavigation(); // For back navigation

  // Enable "Continue" only if min/max ages are valid
  const canContinue = data.min_age > 0 && data.max_age > 0 && data.min_age <= data.max_age;

  /** Handle slider value changes and update parent state */
  const handleSliderChange = useCallback(
    (low: number, high: number) => {
      if (data.min_age !== low || data.max_age !== high) {
        onUpdate({ min_age: low, max_age: high });
      }
    },
    [data.min_age, data.max_age, onUpdate]
  );

  /** Render slider thumb */
  const renderThumb = useCallback(() => <View style={styles.thumb} />, []);
  /** Render slider rail background */
  const renderRail = useCallback(() => <View style={styles.railBackground} />, []);
  /** Render slider selected rail */
  const renderRailSelected = useCallback(() => <View style={styles.railSelected} />, []);

  /** Back button handler */
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferred Age Range</Text>
        <Text style={styles.subtitle}>Set the age range you are interested in</Text>
      </View>

      {/* Form section */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Age Range</Text>

          {/* Display selected age range */}
          <View style={styles.ageRangeContainer}>
            <Text style={styles.ageRangeDisplay}>
              {data.min_age} - {data.max_age} years old
            </Text>

            {/* Slider component */}
            <View style={styles.rangeSliderContainer}>
              <View style={styles.sliderBox}>
                <RangeSlider
                  style={styles.rangeSlider}
                  min={18} // Minimum allowed age
                  max={26} // Maximum allowed age
                  step={1} // Increment step
                  low={data.min_age} // Current min age
                  high={data.max_age} // Current max age
                  onValueChanged={handleSliderChange} // Update parent state
                  renderThumb={renderThumb} // Custom thumb
                  renderRail={renderRail} // Unselected rail
                  renderRailSelected={renderRailSelected} // Selected rail
                />
              </View>
              <Text style={styles.sliderDescription}>
                Drag the handles to set your preferred age range
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue} // Disabled if age range invalid
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center" },
  form: { flex: 1, marginBottom: 32 },
  fieldContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "500", color: DARK, marginBottom: 8, textAlign: "center" },
  ageRangeContainer: { gap: 16 },
  ageRangeDisplay: { fontSize: 18, fontWeight: "600", color: PRIMARY, textAlign: "center" },
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
  railBackground: { height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", width: "100%" },
  railSelected: { height: 4, borderRadius: 2, backgroundColor: PRIMARY },
  sliderDescription: { fontSize: 12, color: MUTED, textAlign: "center" },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
