import { View, Text, Image, StyleSheet } from "react-native";
import { DARK, MUTED, PRIMARY } from "../../constants/theme";

interface ProfileSummaryProps {
  name: string;
  age: number;
  school: string;
  major: string;
  profilePicture?: string;
}

export default function ProfileSummary({
  name,
  age,
  school,
  major,
  profilePicture,
}: ProfileSummaryProps) {
  return (
    <View style={styles.container}>
      <Image
        source={
          profilePicture
            ? { uri: profilePicture }
            : require("../../assets/images/logo.png")
        }
        style={styles.profileImage}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.age}>{age} years old</Text>
        <Text style={styles.school}>{school}</Text>
        <Text style={styles.major}>{major}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 4,
  },
  age: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 2,
  },
  school: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 2,
  },
  major: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "500",
  },
});
