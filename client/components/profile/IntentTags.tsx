import { View, Text, StyleSheet } from "react-native";
import { PRIMARY, BACKGROUND } from "../../constants/theme";

interface IntentTagsProps {
  intents: string[];
}

export default function IntentTags({ intents }: IntentTagsProps) {
  return (
    <View style={styles.container}>
      {intents.map((intent) => (
        <View key={intent} style={styles.tag}>
          <Text style={styles.tagText}>{intent}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "500",
  },
});
