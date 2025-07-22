import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY } from "../../constants/theme";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setError("");
    if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
      setError("Only .edu emails are allowed.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/verify-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send verification email.");
      } else {
        router.push({ pathname: "/auth/verify-email", params: { email } });
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
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
      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}
      <TouchableOpacity
        className="bg-primary rounded-full py-3"
        onPress={handleVerify}
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-base">
          {loading ? "Sending..." : "Verify Email"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
