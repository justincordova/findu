import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-secondary">
      <Text className="text-3xl font-bold text-dark mb-2">Profile</Text>
      <Text className="text-muted text-lg text-center">
        View and edit your profile details here.
      </Text>
    </View>
  );
}
