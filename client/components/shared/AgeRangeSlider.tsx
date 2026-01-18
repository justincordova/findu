// React core
import React, { useCallback } from "react";

// React Native
import { StyleSheet, Text, View } from "react-native";

// Third-party
import RangeSlider from "rn-range-slider";

// Project imports
import { MUTED, PRIMARY } from "@/constants/theme";

// Constants
const MIN_AGE_LIMIT = 18;
const MAX_AGE_LIMIT = 26;
const AGE_STEP = 1;
const SLIDER_BOX_PADDING = 8;
const SLIDER_BOX_BORDER_RADIUS = 12;
const SLIDER_BOX_BORDER_WIDTH = 1;
const THUMB_SIZE = 20;
const THUMB_BORDER_RADIUS = 10;
const THUMB_BORDER_WIDTH = 2;
const RAIL_HEIGHT = 4;
const RAIL_BORDER_RADIUS = 2;
const CONTAINER_GAP = 16;

// Types
interface AgeRangeSliderProps {
  minAge: number;
  maxAge: number;
  onAgeRangeChange: (min: number, max: number) => void;
}

/**
 * Age range slider component
 * Allows users to select a minimum and maximum age using a draggable range slider
 * Displays current selected range in text
 */

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
            min={MIN_AGE_LIMIT}
            max={MAX_AGE_LIMIT}
            step={AGE_STEP}
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
  ageRangeContainer: { gap: CONTAINER_GAP },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    textAlign: "center",
  },
  rangeSliderContainer: { paddingHorizontal: 8 },
  sliderBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: SLIDER_BOX_BORDER_RADIUS,
    borderWidth: SLIDER_BOX_BORDER_WIDTH,
    borderColor: "#e5e7eb",
    paddingVertical: SLIDER_BOX_PADDING,
    paddingHorizontal: SLIDER_BOX_PADDING,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSlider: { width: "100%", height: 20 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_BORDER_RADIUS,
    backgroundColor: PRIMARY,
    borderWidth: THUMB_BORDER_WIDTH,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  railBackground: {
    height: RAIL_HEIGHT,
    borderRadius: RAIL_BORDER_RADIUS,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  railSelected: {
    height: RAIL_HEIGHT,
    borderRadius: RAIL_BORDER_RADIUS,
    backgroundColor: PRIMARY,
  },
  sliderDescription: { fontSize: 12, color: MUTED, textAlign: "center" },
});
