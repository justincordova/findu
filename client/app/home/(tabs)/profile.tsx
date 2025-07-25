import { View, Text, StyleSheet } from "react-native";
import { BACKGROUND, DARK, MUTED } from "../../../constants/theme";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        Manage your profile and settings here!
      </Text>
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
