import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="mb-3 text-4xl font-bold">FindU</Text>
        <Text className="mb-2 text-lg font-semibold">
          Dating App for Verified College Students Only
        </Text>
        <Text className="text-base italic text-gray-500">
          Discover real connections on your campus.
        </Text>
      </View>
    </SafeAreaView>
  );
}
