import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY } from "../../constants/theme";

export default function VerifyEmail() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleConfirm = () => {
    // In a real app, verify the code here
    router.replace({ pathname: "/auth/complete-signup", params: { email } });
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-md bg-white rounded-2xl shadow-lg px-6 py-8 items-center">
        <Text className="text-2xl font-bold text-dark mb-2">
          Verify Your Email
        </Text>
        <Text className="text-base text-muted mb-6 text-center">
          Enter the 6-digit code sent to
          <Text className="text-primary font-semibold"> {email}</Text>
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-6 bg-white text-center text-2xl tracking-widest"
          placeholder="------"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
        />
        <TouchableOpacity
          className="bg-primary rounded-full py-3 w-full"
          onPress={handleConfirm}
        >
          <Text className="text-white text-center font-bold text-base">
            Confirm
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
