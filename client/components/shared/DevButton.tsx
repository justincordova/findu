import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { DANGER } from "../../constants/theme";

interface DevButtonProps {
  route?: string;
}

export default function DevButton({ route }: DevButtonProps) {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Ensure we get a single string for the route
  const paramRoute = Array.isArray(params.route) ? params.route[0] : params.route;
  const targetRoute = route || paramRoute || "/home/(tabs)/discover";

  const handlePress = () => {
    router.push(targetRoute as any); // navigate freely
  };

  if (!__DEV__) return null; // only show in dev

  return (
    <TouchableOpacity
      style={styles.devButton}
      onPress={handlePress}
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
