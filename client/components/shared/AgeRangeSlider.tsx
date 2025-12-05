import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import RangeSlider from "rn-range-slider";
import { MUTED, PRIMARY } from "../../constants/theme";

interface AgeRangeSliderProps {
  minAge: number;
  maxAge: number;
  onAgeRangeChange: (min: number, max: number) => void;
}

export default function AgeRangeSlider({
  minAge,
  maxAge,
  onAgeRangeChange,
}: AgeRangeSliderProps) {
  const renderThumb = useCallback(() => <View style={styles.thumb} />, []);
  const renderRail = useCallback(() => <View style={styles.railBackground} />, []);
  const renderRailSelected = useCallback(() => <View style={styles.railSelected} />, []);

  return (
    <View style={styles.ageRangeContainer}>
      <Text style={styles.ageRangeDisplay}>
        {minAge} - {maxAge} years old
      </Text>
      <View style={styles.rangeSliderContainer}>
        <View style={styles.sliderBox}>
          <RangeSlider
            style={styles.rangeSlider}
            min={18}
            max={26}
            step={1}
            low={Number(minAge)}
            high={Number(maxAge)}
            onValueChanged={onAgeRangeChange}
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
  );
}

const styles = StyleSheet.create({
  ageRangeContainer: { gap: 16 },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    textAlign: "center",
  },
  rangeSliderContainer: { paddingHorizontal: 8 },
  sliderBox: {
    backgroundColor: "#F9FAFB",
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
