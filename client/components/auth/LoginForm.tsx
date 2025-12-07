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
import { profileApi } from "@/api/profile";
import { useAuth } from "@/hooks/useAuth";

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

/**
 * Login form component with email, password, and visibility toggle
 * Handles authentication and navigates to discover or profile setup based on profile status
 */
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { login, isLoading } = useAuth(); // <-- Use hook

  const handleLogin = async () => {
    setError("");

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error || "Login failed");
      } else {
        // Verify profile exists, navigate accordingly
        try {
          await profileApi.me();
          router.replace("/home/(tabs)/discover");
        } catch {
          // Profile doesn't exist, start setup flow
          router.replace("/profile-setup/1");
        }
      }
    } catch (err) {
      console.error("LoginForm: Login error", err);
      setError("Network error. Please try again.");
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
    marginTop: CONTAINER_MARGIN_TOP,
  },
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
