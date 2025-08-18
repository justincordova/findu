import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, MUTED, BACKGROUND } from "../../constants/theme";
import { verifyOTP } from "../../api/auth";

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  useEffect(() => {
    if (!email) {
      Alert.alert("Error", "No email provided");
      router.replace("/auth");
    }
  }, [email, router]);

  const handleVerifyOTP = async () => {
    if (!email) return;
    
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await verifyOTP({ email, otp });

      if (result.success) {
        Alert.alert(
          "Success!",
          "Your account has been created. You can now log in.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth"),
            },
          ]
        );
      } else {
        setError(result.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // You might want to add a resend OTP endpoint
      Alert.alert("Info", "Please use the signup form again to get a new OTP");
    } catch (error) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to:
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.description}>
          Enter the code from your email to complete your account setup.
        </Text>

        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          placeholderTextColor="#999"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify & Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOTP}
          disabled={loading}
        >
          <Text style={styles.resendButtonText}>Didn't receive the code?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
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
    marginBottom: 24,
    backgroundColor: "white",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 14,
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
  resendButton: {
    alignSelf: "center",
  },
  resendButtonText: {
    color: PRIMARY,
    textDecorationLine: "underline",
    fontSize: 14,
  },
});
