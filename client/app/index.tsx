// React Native core
import { StyleSheet, View } from "react-native";

// Project imports
import { BACKGROUND } from "@/constants/theme";
import ActionButtons from "@/components/entry/ActionButtons";
import FloatingLogo from "@/components/entry/FoatingLogo";
import HeaderSection from "@/components/entry/HeaderSection";
import TermsSection from "@/components/entry/TermsSection";

// Constants
const TOP_SECTION_MARGIN_TOP = 40;
const BOTTOM_SECTION_GAP = 40;
const BOTTOM_SECTION_MARGIN_BOTTOM = 30;

/**
 * Entry/landing screen shown before authentication
 * Displays app branding and authentication action buttons
 */
export default function EntryScreen() {
  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <FloatingLogo />
        <HeaderSection />
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
    marginTop: TOP_SECTION_MARGIN_TOP,
  },
  bottomSection: {
    alignItems: "center",
    marginBottom: BOTTOM_SECTION_MARGIN_BOTTOM,
    gap: BOTTOM_SECTION_GAP,
  },
});
