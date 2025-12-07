// React core
import { useEffect } from "react";

// React Native
import { StyleSheet, Text, View } from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";

// Project imports
import {
  BACKGROUND,
  DARK,
  MUTED,
  PRIMARY,
  SECONDARY,
} from "@/constants/theme";
import { profileApi } from "@/api/profile";
import { useAuthStore } from "@/store/authStore";
import { useProfileSetupStore } from "@/store/profileStore";

// Types
interface WelcomeStepProps {
  onNext: () => void;
}

/**
 * Step 1: University information detection and setup
 * Fetches university and campus data from email domain, auto-fills profile
 */
export default function Step1(_props: WelcomeStepProps) {
  const email = useAuthStore((state) => state.email);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);
  const setCampuses = useProfileSetupStore((state) => state.setCampuses);

  useEffect(() => {
    const fetchUniversityData = async () => {
      if (!email) return;

      try {
        const { university, campuses } = await profileApi.domainMap(email);

        // Store the university id and name
        setProfileField("university_id", university.id);
        setProfileField("university_name", university.name);

        if (campuses.length > 0) {
          // Prepare items for the dropdown
          setCampuses(campuses.map((c) => ({ label: c.name, value: c.id })));

          // Set default campus if not already selected
          const defaultCampus = campuses[0];
          setProfileField("campus_id", defaultCampus.id);

          // Store campus name in the store
          setProfileField("campus_name", defaultCampus.name);
        } else {
          // No campuses available
          setProfileField("campus_id", null);
          setProfileField("campus_name", undefined);
          setCampuses([]);
        }
      } catch (err) {
        console.error("Error fetching university data:", err);
      }
    };

    fetchUniversityData();
  }, [email, setProfileField, setCampuses]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={64} color={PRIMARY} />
        </View>

        <Text style={styles.title}>Welcome to FindU</Text>

        <Text style={styles.description}>
          Let&apos;s get started and set up your profile
        </Text>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    alignItems: "center",
    paddingVertical: 100,
  },
  content: {
    alignItems: "center",
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
