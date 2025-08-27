import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { DANGER } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth"; 

interface DevButtonProps {
  route?: string;
}

export default function DevButton({ route }: DevButtonProps) {
  const router = useRouter();
  const { route: paramRouteRaw } = useLocalSearchParams();

  // Auth state from the hook
  const { user, isLoading, logout } = useAuth();

  // Memoize targetRoute safely
  const targetRoute = useMemo(() => {
    const paramRoute = Array.isArray(paramRouteRaw)
      ? paramRouteRaw[0]
      : paramRouteRaw;
    return route || paramRoute || "/home/(tabs)/discover";
  }, [route, paramRouteRaw]);

  const handlePress = () => {
    router.push(targetRoute as any);
  };

  const handleLongPress = () => {
    if (isLoading || !user) {
      Alert.alert("Logout", "You are not signed in.");
      return;
    }

    // Show Yes/No confirmation alert
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
              await logout(); // Call logout from hook
              Alert.alert("Logout", "Successfully logged out.");
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
      delayLongPress={500}
    >
      <Text style={styles.devButtonText}>dev</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: DANGER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 40,
    alignItems: "center",
  },
  devButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
