import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  PRIMARY,
  DARK,
  MUTED,
  BACKGROUND,
  DANGER,
} from "../../constants/theme";
import Button from "@/components/shared/Button";
import { useAuth } from "@/hooks/useAuth";

// Read OTP expiration from env (in seconds)
const OTP_EXPIRATION = Number(process.env.OTP_EXPIRATION_SECONDS) || 600;

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOTP } = useAuth();

  useEffect(() => {
    if (!email) {
      Alert.alert("Error", "No email provided");
      router.replace("/auth");
      return;
    }

    // Start OTP expiration timer
    const timer = setTimeout(() => {
      setExpired(true);
      Alert.alert(
        "OTP Expired",
        "Your verification code has expired. Please request a new one.",
        [{ text: "OK", onPress: () => router.replace("/auth") }]
      );
    }, OTP_EXPIRATION * 1000);

    return () => clearTimeout(timer);
  }, [email, router]);

  const handleVerifyOTP = async () => {
    if (!email || expired) {
      setError("OTP has expired. Please request a new code.");
      return;
    }

    if (otp.length !== 6) {
      setError("Enter 6-digit code");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await verifyOTP(email, otp);
      if (!result.success) {
        setError(result.error || "Failed to verify OTP");
      } else {
        Alert.alert("Success!", "Your account has been created.", [
          { text: "OK", onPress: () => router.replace("/auth") },
        ]);
      }
    } catch (err) {
      console.error("VerifyOTPScreen: OTP verification error", err);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    Alert.alert(
      "Resend OTP",
      "Go back to the signup form to request a new code."
    );
  };

  if (!email) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>Code sent to:</Text>
        <Text style={styles.email}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          placeholderTextColor="#A1A1A1"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          editable={!expired}
        />

        <View style={styles.buttonWrapper}>
          <Button
            label={loading ? "Verifying..." : "Verify"}
            onPress={handleVerifyOTP}
            style={{ opacity: loading ? 0.7 : 1 }}
          />
        </View>

        <Text style={styles.resend} onPress={handleResendOTP}>
          Didn&apos;t receive code?
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 6,
    textAlign: "center",
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    width: 180,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "white",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  buttonWrapper: { width: 180, marginBottom: 10 },
  error: { color: DANGER, textAlign: "center", marginBottom: 10, fontSize: 15 },
  resend: {
    color: PRIMARY,
    textAlign: "center",
    textDecorationLine: "underline",
    fontSize: 15,
    marginTop: 8,
  },
});
