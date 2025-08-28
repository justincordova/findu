import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENT, PRIMARY, MUTED } from "../../constants/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  type?: "gradient" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlineColor?: string;
  width?: DimensionValue;
  height?: number;
  disabled?: boolean; // <-- new
};

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
    borderRadius: 8,
    overflow: "hidden",
  },
  disabledWrapper: {
    opacity: 0.6, // slight fade for disabled
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  outlineBtn: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  outlineText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
