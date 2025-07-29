import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../app/profile-setup/[step]";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface ReviewStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: ReviewStepProps) {
  const router = useRouter();
  const canContinue = true;

  const fieldToStep: { [key: string]: string } = {
    name: "basicInfo",
    age: "basicInfo",
    gender: "basicInfo",
    campus: "basicInfo",
    school: "basicInfo",
    major: "basicInfo",
    schoolYear: "basicInfo",
    gradYear: "basicInfo",
    pronouns: "pref",
    intent: "pref",
    minAge: "pref",
    maxAge: "pref",
    sexualOrientation: "pref",
    genderPreference: "pref",
    bio: "moreInfo",
    profilePicture: "moreInfo",
  };

  const goToStep = (step: string) => {
    router.push(`/profile-setup/${step}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={MUTED} />
        </TouchableOpacity>
        <Text style={styles.title}>Review your profile</Text>
        <Text style={styles.subtitle}>Click the item to go back to edit</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        {[
          "name",
          "age",
          "gender",
          "campus",
          "school",
          "major",
          "schoolYear",
          "gradYear",
        ].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </Text>
            <Text style={styles.infoValue}>
              {String(data[field as keyof ProfileSetupData])}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        {[
          "pronouns",
          "intent",
          "minAge",
          "maxAge",
          "sexualOrientation",
          "genderPreference",
        ].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </Text>
            <Text style={styles.infoValue}>
              {Array.isArray(data[field as keyof ProfileSetupData])
                ? (data[field as keyof ProfileSetupData] as string[]).join(", ")
                : String(data[field as keyof ProfileSetupData])}
            </Text>
          </TouchableOpacity>
        ))}
        {/* More Info */}
        <Text style={styles.sectionTitle}>More Info</Text>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => goToStep("moreInfo")}
        >
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoValue}>{data.bio}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => goToStep("moreInfo")}
        >
          <Text style={styles.infoLabel}>Profile Picture:</Text>
          {data.profilePicture ? (
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>
                Tap to edit
              </Text>
              <View
                style={{
                  borderRadius: 60,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <View>
                  <Text
                    style={{ textAlign: "center", color: DARK, fontSize: 12 }}
                  >
                    Image Preview
                  </Text>
                  <View style={{ alignItems: "center", marginVertical: 8 }}>
                    <Text style={{ color: PRIMARY, fontSize: 12 }}>
                      Image URI:
                    </Text>
                    <Text style={{ color: DARK, fontSize: 10 }}>
                      {data.profilePicture}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              No image selected
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text
          style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}
        >
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: DARK,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: DARK,
    fontWeight: "500",
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  intentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intentTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: PRIMARY,
    borderRadius: 16,
  },
  intentText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: "#6b7280",
  },
  ageRangeContainer: {
    gap: 16,
  },
  ageSliderContainer: {
    marginBottom: 16,
  },
  ageLabel: {
    fontSize: 14,
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    textAlign: "center",
  },
  singleSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "500",
    minWidth: 24,
    textAlign: "center",
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderDescription: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  rangeSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderBox: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSlider: {
    width: "100%",
    height: 20,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
  },
  railBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  railSelected: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
});
