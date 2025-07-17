import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY } from "../../constants/theme";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleVerify = () => {
    if (email) {
      router.push({ pathname: "/auth/verify-email", params: { email } });
    }
  };

  return (
    <View className="w-full mt-6">
      <Text className="text-lg font-bold mb-2 text-dark">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 bg-white"
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text className="text-xs text-muted mb-4">
        Only <Text className="text-primary font-semibold">.edu</Text> emails are
        allowed.
      </Text>
      <TouchableOpacity
        className="bg-primary rounded-full py-3"
        onPress={handleVerify}
      >
        <Text className="text-white text-center font-bold text-base">
          Verify Email
        </Text>
      </TouchableOpacity>
    </View>
  );
}
