import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DANGER } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth"; // Use hook instead of direct fetch
import Button from "../shared/Button";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signup(email, password);

      if (!result.success) {
        setError(result.error || "Signup failed");
      } else {
        // Navigate to verify-otp page with email param
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      console.error("SignupForm: signup error", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#A1A1A1"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#A1A1A1"
      />

      <Button
        label={loading ? "Signing up..." : "Sign Up"}
        onPress={handleSignup}
        style={{ opacity: loading ? 0.7 : 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginTop: 24 },
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
  error: {
    color: DANGER,
    textAlign: "center",
    marginBottom: 16,
  },
});
