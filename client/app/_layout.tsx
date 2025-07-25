import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";

export default function RootLayout() {
  
  return <Stack screenOptions={{ headerShown: false }} />;
}
