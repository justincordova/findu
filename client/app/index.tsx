import { View, StyleSheet } from "react-native";
import { BACKGROUND } from "../constants/theme";
import HeaderSection from "../components/entry/HeaderSection";
import FeaturesSection from "../components/entry/FeaturesSection";
import ActionButtons from "../components/entry/ActionButtons";
import TermsSection from "../components/entry/TermsSection";

export default function EntryScreen() {
  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <HeaderSection />
        <FeaturesSection />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <ActionButtons />
        <TermsSection />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    alignItems: "center",
    marginBottom: 40,
  },
});
