// components/shared/Button.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENT, PRIMARY } from "../../constants/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  type?: "gradient" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlineColor?: string;
  width?: DimensionValue;  // FIX: use correct RN type
  height?: number;
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
}: ButtonProps) {
  const buttonStyle: ViewStyle = {
    width: width ?? "100%",
    height,
  };

  if (type === "gradient") {
    return (
      <TouchableOpacity style={[styles.gradientWrapper, buttonStyle, style]} onPress={onPress}>
        <LinearGradient
          colors={[...GRADIENT] as [string, string, ...string[]]}
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
      style={[styles.outlineBtn, buttonStyle, { borderColor: outlineColor }, style]}
      onPress={onPress}
    >
      <Text style={[styles.outlineText, { color: outlineColor }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: 8,
    overflow: "hidden",
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
