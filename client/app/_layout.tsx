// Polyfill setup
import "react-native-url-polyfill/auto";

// React Native core
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";

// Expo & Navigation
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Project imports
import DevButton from "@/components/shared/DevButton";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import logger from "@/config/logger";
import { useAuth } from "@/hooks/useAuth";
import { useConstantsStore } from "@/store/constantsStore";

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

// Get store methods outside of component to avoid recreation
const fetchConstantsFromStore = () => useConstantsStore.getState().fetchConstants();
const loadCachedConstantsFromStore = () => useConstantsStore.getState().loadCachedConstants();

// Constants
const DEFAULT_FONT_FAMILY = "Inter_400Regular";
const LOADING_INDICATOR_COLOR = "#007AFF";
const DEV_BUTTON_ROUTE = "/profile-setup/0";
const DEV_BUTTON_TOP = 50;
const DEV_BUTTON_RIGHT = 20;

// Set default font globally (once)
if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = [{ fontFamily: DEFAULT_FONT_FAMILY }];

/**
 * Root layout component for the app
 * Handles:
 * - Font initialization with Inter typeface
 * - Session restoration on app startup
 * - Global constants fetching
 * - Splash screen visibility management
 * - Gesture handler setup for native gestures
 */
export default function RootLayout() {
  logger.debug("RootLayout rendered");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isLoggedIn, restoreSession } = useAuth();

  // Initialize session and app state on first render (non-blocking)
  useEffect(() => {
    logger.debug("Starting app initialization");

    // Load cached constants immediately for instant availability
    loadCachedConstantsFromStore().catch((error) =>
      logger.error("Failed to load cached constants", { error })
    );

    // Restore session in background (non-blocking)
    // App navigation routing handles unauthenticated users automatically
    restoreSession().catch((error) =>
      logger.error("Failed to restore session", { error })
    );

    // Fetch fresh constants in background (non-blocking)
    fetchConstantsFromStore().catch((error) =>
      logger.error("Failed to fetch fresh constants", { error })
    );
  }, [restoreSession]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      logger.debug("Fonts loaded, hiding splash screen");
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show loading only until fonts are loaded
  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={LOADING_INDICATOR_COLOR} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isLoggedIn ? (
          // Authenticated routes
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { flex: 1 },
            }}
          >
            <Stack.Screen
              name="home"
              options={{
                gestureEnabled: false,
                headerBackVisible: false,
              }}
            />
            <Stack.Screen
              name="profile-setup"
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="(app)/chat-detail"
              options={{
                presentation: "card",
                gestureEnabled: true,
              }}
            />
          </Stack>
        ) : (
          // Unauthenticated routes
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { flex: 1 },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="auth/index"
              options={{
                gestureEnabled: false,
              }}
            />
          </Stack>
        )}

        {/* Development navigation shortcut (only in dev builds) */}
        {false && __DEV__ && (
          <View style={{ position: "absolute", top: DEV_BUTTON_TOP, right: DEV_BUTTON_RIGHT }}>
            <DevButton route={DEV_BUTTON_ROUTE} />
          </View>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
