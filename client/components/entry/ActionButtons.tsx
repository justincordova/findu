// components/entry/ActionButtons.tsx
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import Button from "../shared/Button";
import DevButton from "../shared/DevButton";

export default function ActionButtons() {
  const router = useRouter();
  const { login } = useAuth();

  const handleDevLogin = async () => {
    const result = await login("test@northeastern.edu", "Testpass1!");
    if (result.success) {
      router.replace("/home/(tabs)/discover");
    }
  };

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

      {/* Dev login button */}
      <DevButton onPress={handleDevLogin} />
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
