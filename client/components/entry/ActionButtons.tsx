// components/entry/ActionButtons.tsx
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Button from "../shared/Button";

export default function ActionButtons() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Gradient button */}
      <Button
        label="Create Account"
        type="gradient"
        onPress={() => router.push("/auth?mode=signup")}
      />

      {/* Outline button */}
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
    gap: 20,
  },
});
