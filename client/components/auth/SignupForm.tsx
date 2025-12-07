// React core
import { useState } from "react";

// React Native
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Third-party
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import Button from "@/components/shared/Button";
import { DANGER } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useProfileSetupStore } from "@/store/profileStore";

// Constants
const CONTAINER_MARGIN_TOP = 24;
const INPUT_BORDER_WIDTH = 1;
const INPUT_BORDER_COLOR = "#D1D5DB";
const INPUT_BORDER_RADIUS = 12;
const INPUT_PADDING_HORIZONTAL = 16;
const INPUT_PADDING_VERTICAL = 14;
const INPUT_MARGIN_BOTTOM = 16;
const INPUT_FONT_SIZE = 16;
const PLACEHOLDER_COLOR = "#A1A1A1";
const PASSWORD_PADDING_RIGHT = 50;
const EYE_ICON_SIZE = 20;
const EYE_ICON_COLOR = "#6B7280";
const EYE_BUTTON_PADDING = 4;
const EYE_BUTTON_RIGHT = 16;
const EYE_BUTTON_TRANSLATE_Y = -14;
const ERROR_MARGIN_BOTTOM = 16;
const OTP_INFO_FONT_SIZE = 16;
const OTP_INFO_COLOR = "#4B5563";
const OTP_INFO_MARGIN_BOTTOM = 16;
const BACK_LINK_MARGIN_TOP = 16;
const BACK_LINK_COLOR = "#4B5563";
const OTP_MAX_LENGTH = 6;

/**
 * Signup form component with email, password, and OTP verification
 * Two-step form: email/password → OTP verification → profile setup
 */
export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("details"); // 'details' or 'otp'

  const router = useRouter();
  const { sendOtp, verifyAndSignup, isLoading } = useAuth();
  const resetProfile = useProfileSetupStore((state) => state.reset);

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
      resetProfile();
      router.replace("/profile-setup/1");
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
            placeholderTextColor={PLACEHOLDER_COLOR}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor={PLACEHOLDER_COLOR}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={EYE_ICON_SIZE}
                color={EYE_ICON_COLOR}
              />
            </TouchableOpacity>
          </View>
          <Button
            label={isLoading ? "Sending OTP..." : "Create Account"}
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
            maxLength={OTP_MAX_LENGTH}
            placeholderTextColor={PLACEHOLDER_COLOR}
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
  container: { width: "100%", marginTop: CONTAINER_MARGIN_TOP },
  input: {
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: INPUT_BORDER_COLOR,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    paddingVertical: INPUT_PADDING_VERTICAL,
    marginBottom: INPUT_MARGIN_BOTTOM,
    backgroundColor: "white",
    fontSize: INPUT_FONT_SIZE,
  },
  error: {
    color: DANGER,
    textAlign: "center",
    marginBottom: ERROR_MARGIN_BOTTOM,
  },
  otpInfo: {
    textAlign: "center",
    marginBottom: OTP_INFO_MARGIN_BOTTOM,
    fontSize: OTP_INFO_FONT_SIZE,
    color: OTP_INFO_COLOR,
  },
  backLink: {
    textAlign: "center",
    marginTop: BACK_LINK_MARGIN_TOP,
    color: BACK_LINK_COLOR,
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    position: "relative",
    marginBottom: INPUT_MARGIN_BOTTOM,
  },
  passwordInput: {
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: INPUT_BORDER_COLOR,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    paddingRight: PASSWORD_PADDING_RIGHT,
    paddingVertical: INPUT_PADDING_VERTICAL,
    backgroundColor: "white",
    fontSize: INPUT_FONT_SIZE,
  },
  eyeButton: {
    position: "absolute",
    right: EYE_BUTTON_RIGHT,
    top: "50%",
    transform: [{ translateY: EYE_BUTTON_TRANSLATE_Y }],
    padding: EYE_BUTTON_PADDING,
  },
});