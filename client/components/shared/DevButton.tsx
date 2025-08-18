import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { DANGER, PRIMARY } from "../../constants/theme";

export default function DevButton({ route }: any) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, isLoggedIn, logout } = useAuthStore();

  // Use route prop first, then fall back to URL params, then default
  const targetRoute = route || params.route || "/home/(tabs)/discover";

  const handleDevMode = () => {
    if (isLoggedIn) {
      // If already in dev mode, just navigate
      router.push(targetRoute);
      return;
    }

    // Create a fake Supabase User object
    const mockUser = {
      id: "dev-user-123",
      aud: "authenticated",
      role: "authenticated",
      email: "dev@example.com",
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
      user_metadata: {
        username: "devuser",
        f_name: "Dev",
        l_name: "User",
        role: "user",
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create a fake Supabase Session object
    const mockSession = {
      access_token: "dev-access-token-12345",
      refresh_token: "dev-refresh-token-12345",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "bearer",
      user: mockUser,
    };

    // Set auth state to logged in with fake session
    login(mockUser, mockSession);

    // Navigate to specified route
    router.push(targetRoute);
  };

  const handleLongPress = () => {
    if (isLoggedIn) {
      Alert.alert(
        "Reset Dev Mode",
        "Do you want to clear the dev authentication and return to login?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Reset",
            style: "destructive",
            onPress: async () => {
              await logout();
              router.replace("/auth");
            },
          },
        ]
      );
    }
  };

  // Only show in development
  if (!__DEV__) return null;

  return (
    <TouchableOpacity
      style={[styles.devButton, isLoggedIn && styles.devButtonActive]}
      onPress={handleDevMode}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <Text style={styles.devButtonText}>{isLoggedIn ? "Dev✓" : "Dev"}</Text>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 40,
    alignItems: "center",
  },
  devButtonActive: {
    backgroundColor: PRIMARY,
    transform: [{ scale: 1.1 }],
  },
  devButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
