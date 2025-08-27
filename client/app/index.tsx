import { View, StyleSheet } from "react-native";
import { BACKGROUND } from "../constants/theme";
import HeaderSection from "../components/entry/HeaderSection";
import ActionButtons from "../components/entry/ActionButtons";
import TermsSection from "../components/entry/TermsSection";
import FloatingLogo from "@/components/entry/FoatingLogo";

export default function EntryScreen() {
  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <FloatingLogo />
        {/* <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        /> */}
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
    justifyContent: "center", // keep centered vertically
    alignItems: "center",
    marginTop: 40, // push everything down slightly (fine-tune)
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 12, // space between logo and text
  },
  bottomSection: {
    alignItems: "center",
    marginBottom: 30,
    gap: 40,
  },
});
