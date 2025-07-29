import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/authStore";
import {
  BACKGROUND,
  DARK,
  MUTED,
  PRIMARY,
  SECONDARY,
} from "../../../constants/theme";

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

const ProfileHeader = () => (
  <View style={styles.headerContainer}>
    <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
    <Text style={styles.name}>{user.name}</Text>
    <Text style={styles.pronouns}>{user.pronouns}</Text>
    <Text style={styles.bio}>{user.bio}</Text>
  </View>
);

const IntentTags = () => (
  <View style={styles.intentContainer}>
    {user.intent.map((intent) => (
      <View key={intent} style={styles.intentTag}>
        <Text style={styles.intentText}>{intent}</Text>
      </View>
    ))}
  </View>
);

const DetailsCard = () => (
  <View style={styles.detailsCard}>
    <Text style={styles.detailsTitle}>Details</Text>
    <DetailRow label="School" value={user.school} />
    <DetailRow label="Major" value={user.major} />
    <DetailRow label="Grad Year" value={user.gradYear} />
    <DetailRow label="Age" value={user.age.toString()} />
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const ActionButtons = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/profile-setup/1")}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ProfileHeader />
      <IntentTags />
      <DetailsCard />
      <ActionButtons />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  contentContainer: {
    alignItems: "center",
    padding: 24,
    justifyContent: "flex-end",
    minHeight: "100%",
  },
  headerContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 96,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: PRIMARY,
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 4,
  },
  pronouns: {
    color: PRIMARY,
    fontWeight: "600",
    marginBottom: 8,
  },
  bio: {
    fontSize: 18,
    textAlign: "center",
    color: DARK,
    marginBottom: 16,
  },
  intentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  intentTag: {
    backgroundColor: SECONDARY,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  intentText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "500",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 24,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    color: MUTED,
    fontWeight: "500",
  },
  detailValue: {
    color: DARK,
  },
  buttonContainer: {
    width: "100%",
  },
  editButton: {
    backgroundColor: PRIMARY,
    borderRadius: 25,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 8,
  },
  editButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 25,
    paddingVertical: 12,
    width: "100%",
  },
  logoutButtonText: {
    color: DARK,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
