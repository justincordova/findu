import { Tabs, useNavigation } from "expo-router";
import { Compass, Users, MessageCircle, User } from "lucide-react-native";
import { PRIMARY } from "../../constants/theme";
import CustomTabBar from "../../components/shared/CustomTabBar";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function TabLayout() {
  const navigation = useNavigation();

  // Prevent back navigation from home screens, but allow it if user is logged out
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Get current auth state from store (not from closure) to ensure we have latest value
      const { isLoggedIn } = useAuthStore.getState();
      // Allow navigation if user is not logged in (e.g., after signout)
      if (!isLoggedIn) {
        return; // Allow the navigation
      }
      // Prevent default behavior of leaving the screen
      e.preventDefault();
    });

    return unsubscribe;
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
