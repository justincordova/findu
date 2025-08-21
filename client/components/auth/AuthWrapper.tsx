import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useSafeNav } from "../../utils/useSafeNav";
import { BACKGROUND } from "../../constants/theme";

// Read env variable
const ENABLE_AUTH = process.env.ENABLE_AUTH === "true";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isLoggedIn, isLoading, user, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { navigate } = useSafeNav();

  useEffect(() => {
    if (!ENABLE_AUTH) return; // skip auth in dev/test mode

    if (isLoading) return; // wait for auth state

    // Redirect authenticated users from / or /auth to home
    if (isLoggedIn && user && session) {
      if (pathname === "/" || pathname.startsWith("/auth")) {
        navigate("/home/(tabs)/discover", true);
      }
    } 
    // Redirect unauthenticated users from protected routes
    else {
      const isProtected = pathname !== "/" && !pathname.startsWith("/auth");
      if (isProtected) {
        Alert.alert("Access Denied", "You must be logged in to access this page.");
        navigate("/", false); // go back to entry
      }
    }
  }, [isLoggedIn, isLoading, user, session, router, pathname, navigate]);

  // Show loading spinner while auth state is being resolved
  if (ENABLE_AUTH && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },
});
