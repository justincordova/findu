// React core
import React, { useMemo } from "react";

// React Native
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

// Navigation
import { useLocalSearchParams, useRouter } from "expo-router";

// Project imports
import { useAuth } from "@/hooks/useAuth";
import { DANGER } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

// Constants
const DEFAULT_ROUTE = "/home/(tabs)/discover";
const LONG_PRESS_DELAY = 500;
const BUTTON_HORIZONTAL_PADDING = 12;
const BUTTON_VERTICAL_PADDING = 8;
const BUTTON_BORDER_RADIUS = 20;
const BUTTON_MIN_WIDTH = 40;
const BUTTON_TEXT_SIZE = 12;
const DEV_Z_INDEX = 1000;

// Types
interface DevButtonProps {
  route?: string;
}

/**
 * Development navigation button (only visible in __DEV__ mode)
 * Short press: navigate to specified route
 * Long press: logout and return to entry screen
 */

export default function DevButton({ route }: DevButtonProps) {
  const router = useRouter();
  const { route: paramRouteRaw } = useLocalSearchParams();

  // Auth state from store
  const { userId, isLoading } = useAuthStore();
  const { signOut } = useAuth(); // Get signOut from useAuth hook

  // Memoize target route safely (prop > param > default)
  const targetRoute = useMemo(() => {
    const paramRoute = Array.isArray(paramRouteRaw)
      ? paramRouteRaw[0]
      : paramRouteRaw;
    return route || paramRoute || DEFAULT_ROUTE;
  }, [route, paramRouteRaw]);

  // Navigate to target route on short press
  const handlePress = () => {
    router.push(targetRoute as any);
  };

  // Show logout confirmation on long press
  const handleLongPress = () => {
    if (isLoading || !userId) {
      Alert.alert("Logout", "You are not signed in.");
      return;
    }

    Alert.alert(
      "Confirm Logout",
      "Do you really want to log out?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await signOut();
              if (result?.success) {
                // Navigate immediately - the home layout checks current auth state
                // and will allow navigation since isLoggedIn is now false
                router.replace("/" as any);
                Alert.alert("Logout", "Successfully logged out.");
              } else {
                Alert.alert("Logout", result?.error || "Logout failed. Check logs.");
              }
            } catch (err) {
              console.error("DevButton: Logout failed", err);
              Alert.alert("Logout", "Logout failed. Check logs.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!__DEV__) return null;

  return (
    <TouchableOpacity
      style={styles.devButton}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={LONG_PRESS_DELAY}
    >
      <Text style={styles.devButtonText}>dev</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: DANGER,
    paddingHorizontal: BUTTON_HORIZONTAL_PADDING,
    paddingVertical: BUTTON_VERTICAL_PADDING,
    borderRadius: BUTTON_BORDER_RADIUS,
    zIndex: DEV_Z_INDEX,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: BUTTON_MIN_WIDTH,
    alignItems: "center",
  },
  devButtonText: {
    color: "white",
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: "600",
    textAlign: "center",
  },
});
