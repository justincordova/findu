import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY, BACKGROUND, DARK, MUTED } from "../../constants/theme";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(
        `${
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
        }/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
      } else {
        setSuccess(data.message || "Reset email sent successfully");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKGROUND,
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: DARK,
    alignSelf: "flex-start",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: "white",
    width: "100%",
    fontSize: 16,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  success: {
    color: "#10B981",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 14,
    color: MUTED,
    marginTop: 8,
    textAlign: "center",
    width: "100%",
  },
  primaryText: {
    color: PRIMARY,
    fontWeight: "bold",
  },
});
