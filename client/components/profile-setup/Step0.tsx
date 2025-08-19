import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DARK,
  MUTED,
  PRIMARY,
  SECONDARY,
  BACKGROUND,
} from "../../constants/theme";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={64} color={PRIMARY} />
        </View>

        <Text style={styles.title}>Welcome to FindU</Text>

        <Text style={styles.subtitle}>Find your college sweet heart</Text>

        <Text style={styles.description}>
          Let&apos;s get started and set up your profile
        </Text>
      </View>

      {/* <View style={styles.features}>
        <View style={styles.feature}>
          <Ionicons name="school" size={24} color={MUTED} />
          <Text style={styles.featureText}>University verified profiles</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="shield-checkmark" size={24} color={MUTED} />
          <Text style={styles.featureText}>Safe and secure matching</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="people" size={24} color={MUTED} />
          <Text style={styles.featureText}>Campus-only community</Text>
        </View>
      </View> */}

      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 128,
    height: 128,
    backgroundColor: SECONDARY,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: DARK,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: MUTED,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  features: {
    width: "100%",
    gap: 16,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
  },
  featureText: {
    marginLeft: 12,
    color: DARK,
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 48,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
