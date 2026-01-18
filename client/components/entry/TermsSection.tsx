// React Native
import { StyleSheet, Text } from "react-native";

// Project imports
import { MUTED } from "@/constants/theme";

// Constants
const TEXT_SIZE = 12;
const MARGIN_TOP = 20;

/**
 * Terms/subtitle text section displayed at bottom of entry screen
 */
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
    fontSize: TEXT_SIZE,
    marginTop: MARGIN_TOP,
  },
});
