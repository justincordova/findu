import { View, Text, Image, StyleSheet } from "react-native";
import { DARK, MUTED } from "../../constants/theme";

interface HeaderSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function HeaderSection({
  title = "FindU",
  subtitle = "Dating App for Verified College Students Only",
  description = "Discover real connections on your campus.",
}: HeaderSectionProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontStyle: "italic",
    fontSize: 18,
    color: MUTED,
    textAlign: "center",
    marginBottom: 24,
  },
}); 