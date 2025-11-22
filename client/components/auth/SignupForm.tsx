import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DANGER } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import Button from "../shared/Button";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("details"); // 'details' or 'otp'
  
  const router = useRouter();
  const { sendOtp, verifyAndSignup, isLoading } = useAuth();

  const handleSendOtp = async () => {
    setError("");
    const result = await sendOtp(email);
    if (result.success) {
      setStep("otp");
    } else {
      setError(result.error || "Failed to send OTP.");
    }
  };

  const handleVerifyAndSignup = async () => {
    setError("");
    const result = await verifyAndSignup(email, password, otp);
    if (result.success) {
      router.replace("/home/(tabs)/discover");
    } else {
      setError(result.error || "Signup failed.");
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {step === "details" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A1A1A1"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor="#A1A1A1"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
          <Button
            label={isLoading ? "Sending OTP..." : "Send OTP"}
            onPress={handleSendOtp}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          />
        </>
      )}

      {step === "otp" && (
        <>
          <Text style={styles.otpInfo}>An OTP has been sent to {email}.</Text>
          <TextInput
            style={styles.input}
            placeholder="6-Digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#A1A1A1"
          />
          <Button
            label={isLoading ? "Verifying..." : "Sign Up & Verify"}
            onPress={handleVerifyAndSignup}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          />
           <Text style={styles.backLink} onPress={() => setStep("details")}>
            Back to email/password
          </Text>
        </>
      )}
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
  otpInfo: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  backLink: {
    textAlign: "center",
    marginTop: 16,
    color: "#4B5563",
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    paddingVertical: 14,
    backgroundColor: "white",
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
    padding: 4,
  },
});