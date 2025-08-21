import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { DARK } from "../../constants/theme";

interface TextButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function TextButton({ title, onPress, style }: TextButtonProps) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    color: DARK,
    fontSize: 16,
    fontWeight: "500",
  },
});
