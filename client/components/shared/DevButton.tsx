import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { PRIMARY, DANGER } from "../../constants/theme";

export default function DevButton({ route }: any) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuthStore();

  // Use route prop first, then fall back to URL params, then default
  const targetRoute = route || params.route || "/home/(tabs)/discover";

  const handleDevMode = () => {
    const mockUser = {
      id: "dev-user-123",
      email: "dev@example.com",
      username: "devuser",
      f_name: "Dev",
      l_name: "User",
      role: "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set auth state to logged in
    login(mockUser, "dev-access-token", "dev-refresh-token");

    // Navigate to specified route using push
    router.push(targetRoute);
  };

  // Only show in development
  if (!__DEV__) return null;

  return (
    <TouchableOpacity style={styles.devButton} onPress={handleDevMode}>
      <Text style={styles.devButtonText}>Dev</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: DANGER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
