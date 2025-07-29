import { View, StyleSheet } from "react-native";
import { ShieldCheck, Users, Heart } from "lucide-react-native";
import FeatureItem from "./FeatureItem";

export default function FeaturesSection() {
  const features = [
    { icon: ShieldCheck, text: "Verified" },
    { icon: Users, text: "Campus Only" },
    { icon: Heart, text: "Real Connections" },
  ];

  return (
    <View style={styles.container}>
      {features.map((feature, index) => (
        <FeatureItem key={index} icon={feature.icon} text={feature.text} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    gap: 40,
  },
}); 