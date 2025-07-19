import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY } from "../../constants/theme";
import { supabase } from "../../services/supabase";

export default function VerifyEmail() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const emailStr = typeof email === "string" ? email : email[0] || "";
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: emailStr,
        token: code,
        type: "email",
      });
      if (otpError) {
        setError(otpError.message || "Invalid or expired code.");
      } else {
        router.replace({
          pathname: "/auth/complete-signup",
          params: { email },
        });
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
        {error ? (
          <Text className="text-red-500 text-center mb-4">
            {typeof error === "string"
              ? error
              : (error as any)?.message
                ? (error as any).message
                : JSON.stringify(error)}
          </Text>
        ) : null}
        <TouchableOpacity
          className="bg-primary rounded-full py-3 w-full"
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-base">
            {loading ? "Verifying..." : "Confirm"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
