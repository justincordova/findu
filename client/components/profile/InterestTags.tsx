import { View, Text, StyleSheet } from "react-native";
import { PRIMARY, SECONDARY, DARK } from "../../constants/theme";

interface InterestTagsProps {
  interests: string[];
}

export default function InterestTags({ interests }: InterestTagsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interests</Text>
      <View style={styles.tagsContainer}>
        {interests.map((interest, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: SECONDARY,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "500",
  },
});
