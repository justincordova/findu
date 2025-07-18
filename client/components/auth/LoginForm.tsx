import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY } from "../../constants/theme";
import { supabase } from "../../services/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    console.log("Login attempt:", { email, password });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("Supabase login result:", { data, error });
    if (error) {
      setError(error.message || "Login failed");
    } else {
      router.replace("/home/(tabs)/discover");
    }
  };

  return (
    <View className="w-full mt-6">
      <Text className="text-lg font-bold mb-2 text-dark">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-white"
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text className="text-lg font-bold mb-2 text-dark">Password</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 bg-white"
        placeholder="Enter your password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}
      <TouchableOpacity
        className="bg-primary rounded-full py-3"
        onPress={handleLogin}
      >
        <Text className="text-white text-center font-bold text-base">
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
