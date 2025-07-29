import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LucideIcon } from "lucide-react-native";
import { DARK } from "../../constants/theme";

interface FeatureItemProps {
  icon: LucideIcon;
  text: string;
  iconColor?: string;
  gradientColors?: string[];
}

export default function FeatureItem({
  icon: Icon,
  text,
  iconColor = "#E63946",
  gradientColors = ["#FDE7EA", "#F1FAEE"],
}: FeatureItemProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon size={24} color={iconColor} />
      </LinearGradient>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  text: {
    color: DARK,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
}); 