import { View, Text, StyleSheet } from "react-native";
import { BACKGROUND, DARK, MUTED } from "../../../constants/theme";

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Your conversations will appear here!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 18,
    textAlign: "center",
  },
});
