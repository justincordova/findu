import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import PrimaryButton from "../shared/PrimaryButton";
import TextButton from "../shared/TextButton";

export default function ActionButtons() {
  const router = useRouter();

  const handleSignup = () => router.push("/auth?mode=signup");
  const handleLogin = () => router.push("/auth?mode=login");

  return (
    <View style={styles.container}>
      <PrimaryButton title="Create an Account" onPress={handleSignup} />
      <TextButton title="Sign In" onPress={handleLogin} style={styles.signIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    alignItems: "center",
    gap: 12,
  },
  signIn: {
    marginTop: 8,
  },
});
