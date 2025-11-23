import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import DevButton from "@/components/shared/DevButton";
import logger from "@/config/logger";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useAuth } from "@/hooks/useAuth";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

// Set default font globally (once)
if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = [{ fontFamily: "Inter_400Regular" }];

export default function RootLayout() {
  logger.info("RootLayout: Rendering...");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isLoading, restoreSession } = useAuth();

  // Restore session on app start
  useEffect(() => {
    (async () => {
      logger.info("RootLayout: Restoring session...");
      await restoreSession();
    })();
  }, [restoreSession]);

  // Hide splash screen once fonts and auth check are ready
  useEffect(() => {
    if (fontsLoaded) {
      logger.info("RootLayout: Fonts loaded, hiding splash screen");
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <Stack.Screen
          name="home"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="profile-setup/Welcome"
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack>

      {/* Loading overlay */}
      {(isLoading || !fontsLoaded) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Dev button */}
      {__DEV__ && (
        <View style={{ position: "absolute", top: 50, right: 20 }}>
          <DevButton route="/profile-setup/0" />
        </View>
      )}
    </GestureHandlerRootView>
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
