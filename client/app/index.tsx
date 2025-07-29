import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck, Users, Heart } from "lucide-react-native";
import { GRADIENT, BACKGROUND, DARK, MUTED } from "../constants/theme";

export default function EntryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top Section (App Name, Subheadings) */}
      <View style={styles.topSection}>
        <View style={styles.centerContent}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>FindU</Text>
          <Text style={styles.subtitle}>
            Dating App for Verified College Students Only
          </Text>
          <Text style={styles.description}>
            Discover real connections on your campus.
          </Text>
          {/* Middle Section (Feature Icons) */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={styles.featureIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ShieldCheck size={24} color="#E63946" />
              </LinearGradient>
              <Text style={styles.featureText}>Verified</Text>
            </View>
            <View style={styles.featureItem}>
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={styles.featureIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Users size={24} color="#E63946" />
              </LinearGradient>
              <Text style={styles.featureText}>Campus Only</Text>
            </View>
            <View style={styles.featureItem}>
              <LinearGradient
                colors={["#FDE7EA", "#F1FAEE"]}
                style={styles.featureIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Heart size={24} color="#E63946" />
              </LinearGradient>
              <Text style={styles.featureText}>Real Connections</Text>
            </View>
          </View>
        </View>
      </View>
      {/* Bottom Section (Login/Signup and Terms) */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          {/* Log In button with gradient border */}
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/auth?mode=login")}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </LinearGradient>
          {/* Sign Up button with gradient border */}
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push("/auth?mode=signup")}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.underline}>Terms & Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    alignItems: "center",
  },
  logo: {
    width: 96,
    height: 96,
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
  featuresContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 40,
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  bottomSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 16,
  },
  gradientBorder: {
    borderRadius: 9999,
    padding: 2,
  },
  loginButton: {
    width: 128,
    backgroundColor: "white",
    borderRadius: 9999,
    alignItems: "center",
    paddingVertical: 12,
  },
  loginButtonText: {
    color: DARK,
    fontSize: 18,
    fontWeight: "600",
  },
  signupButton: {
    width: 128,
    backgroundColor: "white",
    borderRadius: 9999,
    alignItems: "center",
    paddingVertical: 12,
  },
  signupButtonText: {
    color: DARK,
    fontSize: 18,
    fontWeight: "600",
  },
  termsText: {
    textAlign: "center",
    color: MUTED,
    fontSize: 12,
    marginTop: 8,
  },
  underline: {
    textDecorationLine: "underline",
  },
});
