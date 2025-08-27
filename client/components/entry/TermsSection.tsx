import { Text, StyleSheet } from "react-native";
import { MUTED } from "../../constants/theme";

export default function TermsSection() {
  return (
    <Text style={styles.text}>
      Made for college students, by college students
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    color: MUTED,
    fontSize: 12,
    marginTop: 20,
  },
});
