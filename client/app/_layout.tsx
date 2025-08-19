import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import DevButton from "../components/shared/DevButton";
import { AuthWrapper } from "../components/auth/AuthWrapper";

export default function RootLayout() {
  console.log("RootLayout: Rendering...");
  
  return (
    <AuthWrapper>
      <View style={styles.container}>
        {/* Change this to your route */}
        <DevButton route="/home/(tabs)/discover" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
// app/_layout.tsx
//  ⬆ This is your root layout wrapper (not directly navigable)
//  It's applied to routes at the same level (index.tsx, etc.)

// app/index.tsx
// "/" → Starting entry point (home/root screen)

// app/auth/forget-password.tsx
// "/auth/forget-password"

// app/auth/verify-otp/index.tsx
// "/auth/verify-otp"

// app/matches/[userId].tsx
// "/matches/:userId"
// Example: "/matches/123" or "/matches/jane-doe"

// app/onboarding/index.tsx
// "/onboarding"

// app/onboarding/afterInfo.tsx
// "/onboarding/afterInfo"

// app/profile-setup/[step].tsx
// "/profile-setup/:step"
// Example: "/profile-setup/1" or "/profile-setup/basic-info"
