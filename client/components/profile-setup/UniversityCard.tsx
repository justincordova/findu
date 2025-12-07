// React Native
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { BACKGROUND, DARK, PRIMARY, SECONDARY } from "@/constants/theme";

// Types
interface UniversityCardProps {
  universityName: string | null | undefined;
}

/**
 * Enhanced university display card with refined modern design
 * Shows selected university with visual hierarchy and icon accent
 */
export default function UniversityCard({ universityName }: UniversityCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Ionicons name="school" size={24} color={PRIMARY} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Selected University</Text>
          <Text style={styles.universityName}>
            {universityName || "No university selected"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: SECONDARY,
    shadowColor: SECONDARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${SECONDARY}15`, // 15% opacity
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  universityName: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK,
  },
});
