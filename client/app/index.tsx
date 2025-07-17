import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck, Users, Heart } from "lucide-react-native";
import { GRADIENT } from "../constants/theme";

export default function EntryScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-secondary px-6">
      {/* Top Section (App Name, Subheadings) */}
      <View className="flex-1 justify-center items-center">
        <View className="items-center">
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 6, borderRadius: 32, marginBottom: 24 }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 96, height: 96, borderRadius: 24 }}
              resizeMode="contain"
            />
          </LinearGradient>
          <Text className="text-5xl font-bold text-dark mb-2">FindU</Text>
          <Text className="text-xl font-semibold text-dark mb-2 text-center">
            Dating App for Verified College Students Only
          </Text>
          <Text className="italic text-lg text-muted text-center mb-6">
            Discover real connections on your campus.
          </Text>
          {/* Middle Section (Feature Icons) */}
          <View className="flex-row w-full gap-x-10">
            <View className="flex-1 items-center">
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ShieldCheck size={24} color="#E63946" />
              </LinearGradient>
              <Text className="text-dark text-sm font-medium mt-2 text-center">
                Verified
              </Text>
            </View>
            <View className="flex-1 items-center">
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Users size={24} color="#E63946" />
              </LinearGradient>
              <Text className="text-dark text-sm font-medium mt-2 text-center">
                Campus Only
              </Text>
            </View>
            <View className="flex-1 items-center">
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Heart size={24} color="#E63946" />
              </LinearGradient>
              <Text className="text-dark text-sm font-medium mt-2 text-center">
                Real Connections
              </Text>
            </View>
          </View>
        </View>
      </View>
      {/* Bottom Section (Login/Signup and Terms) */}
      <View className="items-center mb-10">
        <View className="flex-row justify-center gap-x-6 mb-4">
          {/* Log In button with gradient border */}
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 9999, padding: 2 }}
          >
            <TouchableOpacity
              style={{
                width: 128,
                backgroundColor: "white",
                borderRadius: 9999,
                alignItems: "center",
                paddingVertical: 12,
              }}
              onPress={() => router.push("/home/(tabs)/discover")}
              activeOpacity={0.8}
            >
              <Text className="text-dark text-lg font-semibold">Log In</Text>
            </TouchableOpacity>
          </LinearGradient>
          {/* Sign Up button with full gradient background */}
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 9999 }}
          >
            <TouchableOpacity
              style={{
                width: 128,
                borderRadius: 9999,
                alignItems: "center",
                paddingVertical: 12,
              }}
              onPress={() => router.push("/profile-setup/welcome")}
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        <Text className="text-center text-muted text-xs mt-2">
          By continuing, you agree to our{" "}
          <Text className="underline">Terms & Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}
