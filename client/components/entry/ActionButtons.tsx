import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import GradientButton from "../shared/GradientButton";

export default function ActionButtons() {
  const router = useRouter();

  const handleLogin = () => router.push("/auth?mode=login");
  const handleSignup = () => router.push("/auth?mode=signup");

  return (
    <View style={styles.container}>
      <GradientButton title="Log In" onPress={handleLogin} />
      <GradientButton title="Sign Up" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 16,
  },
});
