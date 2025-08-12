import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, MUTED } from "../../constants/theme";

export default function SignupSuccess() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const handleResendVerification = () => {
    // TODO: Implement resend verification functionality
    console.log("Resend verification clicked");
  };

  const handleGoToLogin = () => {
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Check Your Email!</Text>
        <Text style={styles.subtitle}>We've sent a verification link to:</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.message}>
          Click the link in your email to verify your account and start using
          FindU.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResendVerification}
          >
            <Text style={styles.secondaryButtonText}>Resend Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: MUTED,
    marginBottom: 8,
    textAlign: "center",
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    marginBottom: 24,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 200,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontWeight: "bold",
    fontSize: 16,
  },
});
