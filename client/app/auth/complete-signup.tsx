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

export default function CompleteSignup() {
  const { email } = useLocalSearchParams();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Refs for keyboard navigation
  const fullNameRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const handleSignup = () => {
    // In a real app, complete signup here
    router.replace("/auth?mode=login");
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
            fullNameRef.current && fullNameRef.current.focus()
          }
          blurOnSubmit={false}
          {...inputProps}
        />
        <Text className="text-lg font-bold mb-2 text-dark w-full">
          Full Name
        </Text>
        <TextInput
          ref={fullNameRef}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4 bg-white w-full"
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={fullName}
          onChangeText={setFullName}
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
        <TouchableOpacity
          className="bg-primary rounded-full py-3 w-full"
          onPress={handleSignup}
        >
          <Text className="text-white text-center font-bold text-base">
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
