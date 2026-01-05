// React core
import React, { useEffect } from "react";

// React Native
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Navigation
import { useLocalSearchParams, useRouter } from "expo-router";

// Project imports
import UserProfileModal from "@/components/discover/UserProfileModal";
import logger from "@/config/logger";
import { BACKGROUND, PRIMARY } from "@/constants/theme";

/**
 * Deeplink profile view screen
 * Accessed via: findu://profile/[userId]
 * Shows another user's profile in a modal
 */
export default function ProfileViewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      logger.error("[profile] No userId provided");
      Alert.alert("Error", "Invalid profile link");
      router.back();
      return;
    }

    logger.info("[profile] Loading profile", { userId });
  }, [userId, router]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <UserProfileModal
        visible={true}
        userId={userId}
        onDismiss={() => {
          logger.debug("[profile] Closing profile modal");
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
