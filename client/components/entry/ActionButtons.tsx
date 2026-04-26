// React Native

// Navigation
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

// Project imports
import Button from "@/components/shared/Button";

// Constants
const BUTTON_GAP = 20;

/**
 * Action buttons for entry screen - navigate to auth signup/login
 */
export default function ActionButtons() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Create account button */}
      <Button
        label="Create Account"
        type="gradient"
        onPress={() => router.push("/auth?mode=signup")}
      />

      {/* Sign in button */}
      <Button
        label="Sign In"
        type="outline"
        onPress={() => router.push("/auth?mode=login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: BUTTON_GAP,
  },
});
