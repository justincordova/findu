import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const getButtonStyle = () => {
    if (disabled) return styles.buttonDisabled;
    switch (variant) {
      case "secondary":
        return styles.buttonSecondary;
      case "danger":
        return styles.buttonDanger;
      default:
        return styles.buttonPrimary;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.textDisabled;
    switch (variant) {
      case "secondary":
        return styles.textSecondary;
      case "danger":
        return styles.textDanger;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, getTextStyle()]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: PRIMARY,
  },
  buttonSecondary: {
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  buttonDanger: {
    backgroundColor: "#D63031",
  },
  buttonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  textPrimary: {
    color: "white",
  },
  textSecondary: {
    color: PRIMARY,
  },
  textDanger: {
    color: "white",
  },
  textDisabled: {
    color: MUTED,
  },
});
