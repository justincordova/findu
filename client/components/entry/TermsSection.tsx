import { Text, StyleSheet } from "react-native";
import { MUTED } from "../../constants/theme";

interface TermsSectionProps {
  text?: string;
  underlinedText?: string;
}

export default function TermsSection({
  text = "By continuing, you agree to our",
  underlinedText = "Terms & Privacy Policy",
}: TermsSectionProps) {
  return (
    <Text style={styles.text}>
      {text} <Text style={styles.underline}>{underlinedText}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    color: MUTED,
    fontSize: 12,
    marginTop: 8,
  },
  underline: {
    textDecorationLine: "underline",
  },
}); 