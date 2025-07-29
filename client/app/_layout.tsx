import "react-native-url-polyfill/auto";
import { Stack, useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import DevButton from "../components/shared/DevButton";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      {/* Change this to your route */}
      <DevButton route="/home/(tabs)/discover" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
