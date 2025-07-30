import { View, Text, Image, StyleSheet } from "react-native";
import { PRIMARY, DARK, MUTED } from "../../constants/theme";

interface ProfileHeaderProps {
  name: string;
  pronouns: string;
  bio: string;
  profilePicture: string;
}

export default function ProfileHeader({
  name,
  pronouns,
  bio,
  profilePicture,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: profilePicture }} style={styles.profileImage} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.pronouns}>{pronouns}</Text>
      <Text style={styles.bio}>{bio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
