import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

interface DevNavigationProps {
  targetRoute: any;
  buttonText?: string;
}

export default function DevNavigation({
  targetRoute,
  buttonText = "Dev",
}: DevNavigationProps) {
  const router = useRouter();
  const { login } = useAuthStore();

  const handleDevMode = () => {
    // Create a mock user for development
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

    // Navigate to target route
    router.replace(targetRoute);
  };

  // Only show in development
  if (!__DEV__) return null;

  return (
    <TouchableOpacity
      style={styles.devButton}
      onPress={handleDevMode}
      activeOpacity={0.8}
    >
      <Text style={styles.devButtonText}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  devButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FF5252",
    marginBottom: 16,
  },
  devButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
