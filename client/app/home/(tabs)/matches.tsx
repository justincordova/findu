import { View, Text } from "react-native";

export default function MatchesScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-3xl font-bold text-dark mb-2">Matches</Text>
      <Text className="text-muted text-lg text-center">
        See who you've matched with!
      </Text>
    </View>
  );
}
