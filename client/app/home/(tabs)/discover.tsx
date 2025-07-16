import { View, Text } from "react-native";

export default function DiscoverScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-secondary">
      <Text className="text-3xl font-bold text-dark mb-2">Discover</Text>
      <Text className="text-muted text-lg text-center">
        Find new people and make connections!
      </Text>
    </View>
  );
}
