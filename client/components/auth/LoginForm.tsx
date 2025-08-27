import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DANGER } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth"; // <-- Use the hook now
import Button from "../shared/Button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { login, isLoading } = useAuth(); // <-- Use hook

  const handleLogin = async () => {
    setError("");

    try {
      const result = await login(email, password); // Hook handles store internally

      if (!result.success) {
        setError(result.error || "Login failed");
      } else {
        router.replace("/home/(tabs)/discover"); // Navigate after successful login
      }
    } catch (err) {
      console.error("LoginForm: Login error", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

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
        label={isLoading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        style={{ opacity: isLoading ? 0.7 : 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 24,
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
  error: {
    color: DANGER,
    textAlign: "center",
    marginBottom: 16,
  },
});
