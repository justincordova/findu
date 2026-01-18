// React core
import { useEffect } from "react";

// Expo & Navigation
import { Tabs, useNavigation } from "expo-router";

// Icons
import { Compass, MessageCircle, User, Users } from "lucide-react-native";

// Project imports
import CustomTabBar from "@/components/shared/CustomTabBar";
import { PRIMARY } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

/**
 * Home tab layout with bottom tab navigation
 * Manages navigation between: Discover, Matches, Messages, Profile
 * Prevents back navigation when logged in (sticky navigation)
 */

export default function TabLayout() {
  const navigation = useNavigation();

  // Prevent back navigation from home screens, but allow it if user is logged out
  useEffect(() => {
    return navigation.addListener("beforeRemove", (e) => {
      // Get current auth state from store (not from closure) to ensure we have latest value
      const { isLoggedIn } = useAuthStore.getState();
      // Allow navigation if user is not logged in (e.g., after signout)
      if (!isLoggedIn) {
        return; // Allow the navigation
      }
      // Prevent default behavior of leaving the screen
      e.preventDefault();
    });
  }, [navigation]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="(tabs)/discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/messages"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
