import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  TextInput as RNTextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";

export default function CompleteSignup() {
  const { email } = useLocalSearchParams();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Refs for keyboard navigation
  const firstNameRef = useRef<RNTextInput>(null);
  const lastNameRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message || "Failed to set password in Supabase.");
        setLoading(false);
        return;
      }
      // 2. Complete signup in your own DB
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username,
          f_name: firstName,
          l_name: lastName,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
      } else {
        router.replace("/profile-setup/0");      
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputProps = Platform.select({
    android: { textAlignVertical: "center" as "center" | undefined },
    ios: {},
    default: {},
  });

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-md bg-white rounded-2xl shadow-lg px-6 py-8 items-center">
        <Text className="text-2xl font-bold text-dark mb-2">
          Complete Signup
        </Text>
        <Text className="text-base text-muted mb-6 text-center">
          For <Text className="text-primary font-semibold">{email}</Text>
        </Text>
        <Text className="text-lg font-bold mb-2 text-dark w-full">
          Username
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4 bg-white w-full"
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ fontSize: 18, fontFamily: "System", fontWeight: "400" }}
          allowFontScaling={false}
          returnKeyType="next"
          onSubmitEditing={() =>
            firstNameRef.current && firstNameRef.current.focus()
          }
          blurOnSubmit={false}
          {...inputProps}
        />
        <Text className="text-lg font-bold mb-2 text-dark w-full">
          First Name
        </Text>
        <TextInput
          ref={firstNameRef}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4 bg-white w-full"
          placeholder="First Name"
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={setFirstName}
          style={{ fontSize: 18, fontFamily: "System", fontWeight: "400" }}
          returnKeyType="next"
          onSubmitEditing={() =>
            lastNameRef.current && lastNameRef.current.focus()
          }
          blurOnSubmit={false}
          {...inputProps}
        />
        <Text className="text-lg font-bold mb-2 text-dark w-full">
          Last Name
        </Text>
        <TextInput
          ref={lastNameRef}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4 bg-white w-full"
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={lastName}
          onChangeText={setLastName}
          style={{ fontSize: 18, fontFamily: "System", fontWeight: "400" }}
          returnKeyType="next"
          onSubmitEditing={() =>
            passwordRef.current && passwordRef.current.focus()
          }
          blurOnSubmit={false}
          {...inputProps}
        />
        <Text className="text-lg font-bold mb-2 text-dark w-full">
          Password
        </Text>
        <TextInput
          ref={passwordRef}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-6 bg-white w-full"
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ fontSize: 18, fontFamily: "System", fontWeight: "400" }}
          returnKeyType="done"
          onSubmitEditing={() =>
            passwordRef.current && passwordRef.current.blur()
          }
          blurOnSubmit={true}
          {...inputProps}
        />
        {error ? (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        ) : null}
        <TouchableOpacity
          className="bg-primary rounded-full py-3 w-full"
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-base">
            {loading ? "Signing Up..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
