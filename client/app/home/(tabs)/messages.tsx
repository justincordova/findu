import { View, Text } from "react-native";

export default function MessagesScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-3xl font-bold text-dark mb-2">Messages</Text>
      <Text className="text-muted text-lg text-center">
        Chat with your matches here!
      </Text>
    </View>
  );
}
