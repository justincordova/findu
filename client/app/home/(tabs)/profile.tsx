import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

// Dummy user data for now; replace with real data fetching later
const user = {
  name: "Zachary Labit",
  email: "labit.z@northeastern.edu",
  bio: "CS major, coffee enthusiast, and aspiring entrepreneur. Looking to meet new people!",
  profilePicture: "https://ui-avatars.com/api/?name=Zachary+Labit&background=ec4899&color=fff&size=256",
  school: "Northeastern University",
  major: "Computer Science",
  gradYear: "2026",
  pronouns: "he/him",
  intent: ["True Love", "Study Buddy"],
  age: 21,
};

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ alignItems: "center", padding: 24, justifyContent: "flex-end", minHeight: "100%" }}
    >
      <View className="items-center w-full mt-24">
        <Image
          source={{ uri: user.profilePicture }}
          className="w-32 h-32 rounded-full mb-4 border-4 border-primary"
        />
        <Text className="text-3xl font-bold text-dark mb-1">{user.name}</Text>
        <Text className="text-pink-600 font-semibold mb-2">{user.pronouns}</Text>
        <Text className="text-lg text-center text-dark mb-4">{user.bio}</Text>
        <View className="flex-row flex-wrap justify-center gap-2 mb-4">
          {user.intent.map((i) => (
            <View key={i} className="bg-pink-100 border border-pink-400 rounded-full px-4 py-1 mr-2 mb-2">
              <Text className="text-pink-600 text-sm font-medium">{i}</Text>
            </View>
          ))}
        </View>
        <View className="w-full bg-white rounded-2xl shadow px-6 py-4 mb-6">
          <Text className="text-lg font-bold text-dark mb-2">Details</Text>
          <View className="flex-row justify-between mb-1">
            <Text className="text-muted font-medium">School</Text>
            <Text className="text-dark">{user.school}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-muted font-medium">Major</Text>
            <Text className="text-dark">{user.major}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-muted font-medium">Grad Year</Text>
            <Text className="text-dark">{user.gradYear}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-muted font-medium">Age</Text>
            <Text className="text-dark">{user.age}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-full py-3 w-full mb-2"
          onPress={() => router.push("/profile-setup/1")}
        >
          <Text className="text-white text-center font-bold text-base">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-gray-200 rounded-full py-3 w-full"
          onPress={() => router.push("../index.tsx")}
        >
          <Text className="text-dark text-center font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
