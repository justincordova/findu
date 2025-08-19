import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuthStore } from "../store/authStore";

// Safe navigation helper
export const useSafeNav = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuthStore();

  const navigate = (path: string, protectedRoute = true) => {
    // If the route is protected, auth is enabled, and user not logged in → block
    if (protectedRoute && isLoading) {
      Alert.alert("Please wait", "Checking authentication...");
      return;
    }
    if (protectedRoute && !isLoggedIn) {
      Alert.alert("Access Denied", "You must be logged in to access this page.");
      return;
    }

    router.push(path as any); // Type-safe casting for Expo Router
  };

  return { navigate };
};
