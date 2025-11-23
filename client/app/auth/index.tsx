import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { PRIMARY, BACKGROUND } from "../../constants/theme";
import LoginForm from "../../components/auth/LoginForm";
import SignupForm from "../../components/auth/SignupForm";
import { useLocalSearchParams, useRouter } from "expo-router";

const TOGGLE_WIDTH = 320;
const TOGGLE_HEIGHT = 48;
const TOGGLE_RADIUS = 10;
const PILL_WIDTH = TOGGLE_WIDTH / 2;
const FORM_BOX_WIDTH = 360;
const FORM_BOX_HEIGHT = 320;

export default function AuthIndex() {
  const { mode: modeParam } = useLocalSearchParams();
  const initialMode = modeParam === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const pillTranslate = useSharedValue(initialMode === "login" ? 0 : PILL_WIDTH);
  const router = useRouter();

  useEffect(() => {
    pillTranslate.value = withTiming(mode === "login" ? 0 : PILL_WIDTH, {
      duration: 250,
    });
  }, [mode, pillTranslate]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslate.value }],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        {/* Animated Toggle */}
        <View style={styles.toggleContainer}>
          <Animated.View style={[styles.pill, pillStyle]} />
          <TouchableOpacity
            style={styles.toggleButton}
            activeOpacity={1}
            onPress={() => setMode("login")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "login" ? styles.activeText : styles.inactiveText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleButton}
            activeOpacity={1}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "signup" ? styles.activeText : styles.inactiveText,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Box */}
        <View style={styles.formWrapper}>
          <View style={styles.formBox}>
            <Animated.View
              style={{
                opacity: mode === "login" ? 1 : 0,
                position: mode === "login" ? "relative" : "absolute",
                width: "100%",
              }}
              pointerEvents={mode === "login" ? "auto" : "none"}
            >
              <LoginForm />
            </Animated.View>
            <Animated.View
              style={{
                opacity: mode === "signup" ? 1 : 0,
                position: mode === "signup" ? "relative" : "absolute",
                width: "100%",
              }}
              pointerEvents={mode === "signup" ? "auto" : "none"}
            >
              <SignupForm />
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // move content to the top
    paddingTop: 80, // adjust this to push the form down a bit from the top
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    color: PRIMARY,
    fontWeight: "bold",
    fontSize: 30,
  },
  toggleContainer: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_RADIUS,
    backgroundColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  pill: {
    position: "absolute",
    left: 0,
    top: 0,
    width: PILL_WIDTH,
    height: TOGGLE_HEIGHT,
    backgroundColor: "white",
    borderRadius: TOGGLE_RADIUS,
    zIndex: 1,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  toggleText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  activeText: {
    color: PRIMARY,
  },
  inactiveText: {
    color: "#6B7280",
  },
  formWrapper: {
    width: "100%",
    alignItems: "center",
    height: FORM_BOX_HEIGHT,
    maxWidth: FORM_BOX_WIDTH,
  },
  formBox: {
    width: "100%",
    borderRadius: 5,
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: FORM_BOX_HEIGHT,
    maxWidth: FORM_BOX_WIDTH,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
