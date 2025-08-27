import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import DevButton from "../components/shared/DevButton";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useAuth } from "../hooks/useAuth"; // <-- use hook, not store directly

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

// Set default font globally (once)
if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = [{ fontFamily: "Inter_400Regular" }];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isLoading, restoreSession } = useAuth();

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Hide splash screen after fonts + auth check
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {__DEV__ && <DevButton route="/profile-setup/0" />}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
