import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { DARK } from "../../constants/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function PrimaryButton({ title, onPress, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: DARK,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
