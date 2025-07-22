import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { PRIMARY } from "../../constants/theme";
import LoginForm from "../../components/auth/LoginForm";
import SignupForm from "../../components/auth/SignupForm";
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const TOGGLE_WIDTH = 320;
const TOGGLE_HEIGHT = 48;
const TOGGLE_RADIUS = 24;
const PILL_WIDTH = TOGGLE_WIDTH / 2;
const FORM_BOX_WIDTH = 360;
const FORM_BOX_MIN_HEIGHT = 370; // Adjust as needed for your forms

export default function AuthIndex() {
  const { mode: modeParam } = useLocalSearchParams();
  const initialMode = modeParam === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const pillTranslate = useSharedValue(
    initialMode === "login" ? 0 : PILL_WIDTH
  );

  React.useEffect(() => {
    pillTranslate.value = withTiming(mode === "login" ? 0 : PILL_WIDTH, {
      duration: 250,
    });
  }, [mode]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslate.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      {/* Animated Toggle */}
      <View
        style={{
          width: TOGGLE_WIDTH,
          height: TOGGLE_HEIGHT,
          borderRadius: TOGGLE_RADIUS,
          backgroundColor: "#F0F0F0",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 32,
          position: "relative",
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              width: PILL_WIDTH,
              height: TOGGLE_HEIGHT,
              backgroundColor: "white",
              borderRadius: TOGGLE_RADIUS,
              zIndex: 1,
            },
            pillStyle,
          ]}
        />
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
          activeOpacity={1}
          onPress={() => setMode("login")}
        >
          <Text
            className={`font-bold text-base ${mode === "login" ? "text-primary" : "text-gray-500"}`}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
          activeOpacity={1}
          onPress={() => setMode("signup")}
        >
          <Text
            className={`font-bold text-base ${mode === "signup" ? "text-primary" : "text-gray-500"}`}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
      {/* Form Box with fixed minHeight */}
      <View
        className="w-full items-center"
        style={{ minHeight: FORM_BOX_MIN_HEIGHT, maxWidth: FORM_BOX_WIDTH }}
      >
        <View
          className="w-full rounded-2xl shadow-lg px-6 py-8"
          style={{
            minHeight: FORM_BOX_MIN_HEIGHT,
            maxWidth: FORM_BOX_WIDTH,
            elevation: 6,
            backgroundColor: "rgba(255,255,255,0.85)",
          }}
        >
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
  );
}
