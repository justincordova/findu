import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DARK, GRADIENT } from "../../constants/theme";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
}

export default function GradientButton({
  title,
  onPress,
  variant = "primary",
  style,
}: GradientButtonProps) {
  return (
    <LinearGradient
      colors={GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradientBorder, style]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 9999,
    padding: 2,
  },
  button: {
    width: 128,
    backgroundColor: "white",
    borderRadius: 9999,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: {
    color: DARK,
    fontSize: 18,
    fontWeight: "600",
  },
});
