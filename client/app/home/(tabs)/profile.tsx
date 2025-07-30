import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BACKGROUND } from "../../../constants/theme";
import ProfileHeader from "../../../components/profile/ProfileHeader";
import IntentTags from "../../../components/profile/IntentTags";
import ProfileDetails from "../../../components/profile/ProfileDetails";
import ProfileActions from "../../../components/profile/ProfileActions";

const user = {
  name: "Zachary Labit",
  email: "labit.z@northeastern.edu",
  bio: "CS major, coffee enthusiast, and aspiring entrepreneur. Looking to meet new people!",
  profilePicture:
    "https://ui-avatars.com/api/?name=Zachary+Labit&background=ec4899&color=fff&size=256",
  school: "Northeastern University",
  major: "Computer Science",
  gradYear: "2026",
  pronouns: "he/him",
  intent: ["True Love", "Study Buddy"],
  age: 21,
};

export default function ProfileScreen() {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push("/profile-setup/1");
  };

  const handleLogOut = () => {
    router.push("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={user.name}
          pronouns={user.pronouns}
          bio={user.bio}
          profilePicture={user.profilePicture}
        />
        <IntentTags intents={user.intent} />
        <ProfileDetails
          school={user.school}
          major={user.major}
          gradYear={user.gradYear}
          age={user.age}
        />
        <ProfileActions
          onEditProfile={handleEditProfile}
          onLogOut={handleLogOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  contentContainer: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 100, // Add extra padding to account for tab bar
  },
});
