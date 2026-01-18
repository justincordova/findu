// React core
import React from "react";

// React Native
import { DimensionValue, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

// Expo
import { LinearGradient } from "expo-linear-gradient";

// Project imports
import { GRADIENT, MUTED, PRIMARY } from "@/constants/theme";

// Constants
const BUTTON_BORDER_RADIUS = 8;
const BUTTON_PADDING_VERTICAL = 16;
const BUTTON_TEXT_SIZE = 16;
const BUTTON_TEXT_WEIGHT = "bold";
const OUTLINE_TEXT_WEIGHT = "600";
const DISABLED_OPACITY = 0.6;

// Types
type ButtonProps = {
  label: string;
  onPress: () => void;
  type?: "gradient" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlineColor?: string;
  width?: DimensionValue;
  height?: number;
  disabled?: boolean;
};

/**
 * Reusable button component with gradient or outline styles
 * Supports disabled state with visual feedback
 */

export default function Button({
  label,
  onPress,
  type = "gradient",
  style,
  textStyle,
  outlineColor = PRIMARY,
  width,
  height,
  disabled = false,
}: ButtonProps) {
  const buttonStyle: ViewStyle = { width: width ?? "100%", height };

  if (type === "gradient") {
    return (
      <TouchableOpacity
        style={[styles.gradientWrapper, buttonStyle, style, disabled && styles.disabledWrapper]}
        onPress={onPress}
        disabled={disabled} // prevent press
      >
        <LinearGradient
          colors={disabled ? [MUTED, MUTED] : ([...GRADIENT] as [string, string, ...string[]])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBtn, buttonStyle]}
        >
          <Text style={[styles.gradientText, textStyle]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.outlineBtn,
        buttonStyle,
        { borderColor: disabled ? MUTED : outlineColor },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.outlineText, { color: disabled ? MUTED : outlineColor }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: BUTTON_BORDER_RADIUS,
    overflow: "hidden",
  },
  disabledWrapper: {
    opacity: DISABLED_OPACITY,
  },
  gradientBtn: {
    paddingVertical: BUTTON_PADDING_VERTICAL,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientText: {
    color: "#fff",
    fontWeight: BUTTON_TEXT_WEIGHT,
    fontSize: BUTTON_TEXT_SIZE,
  },
  outlineBtn: {
    paddingVertical: BUTTON_PADDING_VERTICAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: 1,
    alignItems: "center",
  },
  outlineText: {
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: OUTLINE_TEXT_WEIGHT,
  },
});
