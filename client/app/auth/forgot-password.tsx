import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY, DARK, MUTED } from "../../constants/theme";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRequestReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
      setError("Please enter a valid .edu email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || "Failed to send reset code");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace("/auth");
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email!</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a password reset code to:
          </Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.message}>
            Enter the 6-digit code from your email to reset your password.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Don&apos;t worry! Enter your email address and we&apos;ll send you a
          6-digit verification code to reset your password.
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
        <Text style={styles.note}>
          Didn&apos;t receive the code? Check your spam folder or try again.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGoToLogin}
          >
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending..." : "Send Reset Code"}
            </Text>
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
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: DARK,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: "white",
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 24,
  },
  primaryText: {
    color: PRIMARY,
    fontWeight: "600",
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  buttonDisabled: {
    opacity: 0.7,
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
});
