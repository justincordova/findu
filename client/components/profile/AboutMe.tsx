import { View, Text, StyleSheet } from "react-native";
import { DARK, MUTED, BACKGROUND } from "../../constants/theme";

interface AboutMeProps {
  bio: string;
  pronouns?: string;
}

export default function AboutMe({ bio, pronouns }: AboutMeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Me</Text>
      {pronouns && <Text style={styles.pronouns}>{pronouns}</Text>}
      <Text style={styles.bio}>{bio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  pronouns: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 12,
    fontStyle: "italic",
  },
  bio: {
    fontSize: 16,
    color: DARK,
    lineHeight: 24,
  },
});
