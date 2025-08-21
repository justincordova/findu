import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY, DARK, MUTED } from "../../constants/theme";
import { signup } from "../../api/auth";
import _log from "../../utils/logger"; // import your logger

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setError("");

    if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
      setError("Only .edu emails are allowed.");
      _log.warn("SignupForm: Invalid email format attempted", { email });
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      _log.warn("SignupForm: Password too short", { passwordLength: password.length });
      return;
    }

    setLoading(true);
    try {
      _log.debug("SignupForm: Sending signup request to backend...", { email });

      const result = await signup({ email, password });
      _log.debug("SignupForm: Backend response:", result);

      if (result.success) {
        _log.info(`SignupForm: Signup successful for email ${email}`);
        // Signup successful, redirect to OTP verification
        router.push({ pathname: "/auth/verify-otp", params: { email } });
      } else {
        _log.warn("SignupForm: Signup failed", { message: result.message });
        setError(result.message || "Failed to create account.");
      }
    } catch (error: any) {
      _log.error("SignupForm: Signup error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.emailInput]}
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.note}>
        Only <Text style={styles.primaryText}>.edu</Text> emails are allowed.
      </Text>
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={[styles.input, styles.passwordInput]}
        placeholder="Enter your password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={styles.note}>
        Password must be at least 8 characters with uppercase, lowercase,
        number, and special character.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Signup"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 24,
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
  emailInput: {
    marginBottom: 24,
  },
  passwordInput: {
    marginBottom: 24,
  },
  note: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 16,
  },
  primaryText: {
    color: PRIMARY,
    fontWeight: "600",
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
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
