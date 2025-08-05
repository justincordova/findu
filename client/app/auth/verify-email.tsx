import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, BACKGROUND, DARK, MUTED } from "../../constants/theme";

export default function VerifyEmail() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const emailStr = typeof email === "string" ? email : email[0] || "";

      // Call backend to verify OTP
      const res = await fetch(
        `${
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
        }/api/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailStr,
            code,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired code.");
      } else {
        // Backend returns session token, pass it to complete-signup
        const supabaseToken = data.session?.access_token;
        if (!supabaseToken) {
          setError("No session token returned from server.");
          setLoading(false);
          return;
        }

        router.replace({
          pathname: "/auth/complete-signup",
          params: {
            email,
            supabaseToken,
          },
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to
          <Text style={styles.primaryText}> {email}</Text>
        </Text>
        <TextInput
          style={styles.codeInput}
          placeholder="------"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
        />
        {error ? (
          <Text style={styles.error}>
            {typeof error === "string"
              ? error
              : (error as any)?.message
              ? (error as any).message
              : JSON.stringify(error)}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Confirm"}
          </Text>
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
  primaryText: {
    color: PRIMARY,
    fontWeight: "600",
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    backgroundColor: "white",
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    width: "100%",
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
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
});
