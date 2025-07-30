import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, BACKGROUND } from "../../constants/theme";

// Step components
import WelcomeStep from "../../components/profile-setup/WelcomeStep";
import BasicInfoStep from "../../components/profile-setup/BasicInfoStep";
import PreferencesStep from "../../components/profile-setup/PreferencesStep";
import MoreInfoStep from "../../components/profile-setup/MoreInfoStep";
import ReviewStep from "../../components/profile-setup/ReviewStep";

const STEPS = ["welcome", "basicInfo", "pref", "moreInfo", "review"] as const;
type Step = (typeof STEPS)[number];

export interface ProfileSetupData {
  // Basic Info
  name: string;
  age: number;
  gender: "Male" | "Female" | "Non-binary" | "Other" | null;
  campus: string;
  school: string;
  major: string;
  schoolYear:
    | "Freshman"
    | "Sophomore"
    | "Junior"
    | "Senior"
    | "Graduate"
    | null;
  gradYear: string | null;

  // Preferences
  pronouns: string;
  intent: string[];
  minAge: number;
  maxAge: number;
  sexualOrientation:
    | "Straight"
    | "Gay"
    | "Lesbian"
    | "Bisexual"
    | "Questioning"
    | "Other"
    | null;
  genderPreference: "Men" | "Women" | "Non-binary" | "All" | "Other" | null;

  // More Info
  bio: string;
  profilePicture: string;
}

export default function ProfileSetupStep() {
  const { step: stepParam } = useLocalSearchParams();
  const router = useRouter();

  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: "",
    age: 18,
    gender: null,
    campus: "",
    school: "",
    major: "",
    schoolYear: null,
    gradYear: null,
    pronouns: "",
    intent: [],
    minAge: 18,
    maxAge: 25,
    sexualOrientation: null,
    genderPreference: null,
    bio: "",
    profilePicture: "",
  });

  const step = (stepParam as Step) || "welcome";
  const currentStepIndex = STEPS.indexOf(step) + 1;
  const isValidStep = STEPS.includes(step);

  useEffect(() => {
    if (!isValidStep) {
      router.replace("/profile-setup/welcome");
    }
  }, [step, isValidStep, router]);

  const goToNextStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      router.push(`/profile-setup/${nextStep}`);
    } else {
      // Profile setup complete
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      const prevStep = STEPS[currentIndex - 1];
      router.push(`/profile-setup/${prevStep}`);
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Save profile data to backend
      console.log("Profile setup complete:", profileData);

      // Navigate to main app
      router.replace("/");
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const updateProfileData = (data: Partial<ProfileSetupData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeStep onNext={goToNextStep} />;
      case "basicInfo":
        return (
          <BasicInfoStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "pref":
        return (
          <PreferencesStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "moreInfo":
        return (
          <MoreInfoStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "review":
        return (
          <ReviewStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={handleComplete}
            onBack={goToPreviousStep}
          />
        );
      default:
        return null;
    }
  };

  if (!isValidStep) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress bar */}
        {step !== "welcome" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Step {currentStepIndex} of {STEPS.length - 1}
              </Text>
              <Text style={styles.progressText}>
                {Math.round((currentStepIndex / (STEPS.length - 1)) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Step content */}
        <View style={styles.stepContent}>{renderStep()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: DARK,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
  },
  progressFill: {
    height: 8,
    backgroundColor: PRIMARY,
    borderRadius: 9999,
  },
  stepContent: {
    flex: 1,
  },
});
