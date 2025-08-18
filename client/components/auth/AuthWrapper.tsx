import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { BACKGROUND } from "../../constants/theme";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isLoggedIn, isLoading, user, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn && user && session) {
        // User is authenticated, redirect to home if not already there
        if (pathname === "/" || pathname.startsWith("/auth")) {
          router.replace("/home/(tabs)/discover");
        }
      } else {
        // User is not authenticated, redirect to entry screen if on protected route
        if (pathname !== "/" && !pathname.startsWith("/auth")) {
          router.replace("/");
        }
      }
    }
  }, [isLoggedIn, isLoading, user, session, router, pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Always render children - let the router handle redirects
  // This prevents the black screen issue
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
