import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, BACKGROUND } from "../../constants/theme";
import { ProfileSetupData } from "../../types/ProfileSetupData";

// Step components
import Step0 from "../../components/profile-setup/Step0"; // Welcome
import Step1 from "../../components/profile-setup/Step1"; // Welcome
import Step2 from "../../components/profile-setup/Step2"; // Basic Info
import Step3 from "../../components/profile-setup/Step3"; // Preferences
import Step4 from "../../components/profile-setup/Step4"; // More Info (bio/avatar)
import Step5 from "../../components/profile-setup/Step5"; // Create bio / profile picture
import Step6 from "../../components/profile-setup/Step6"; // Add photos
import Step7 from "../../components/profile-setup/Step7"; // Review

const STEPS = ["step0", "step1", "step2", "step3", "step4", "step5", "step6", "step7"] as const;
type Step = (typeof STEPS)[number];

export default function ProfileSetupStep() {
  const { step: stepParam } = useLocalSearchParams();
  const router = useRouter();

  const [profileData, setProfileData] = useState<ProfileSetupData>({
    // Basic Info
    name: "",
    avatar_url: "",
    age: 18,
    birthdate: "",
    gender: "Male",
    pronouns: "",
    bio: "",
    // Academic Info
    university: "",
    university_year: "Freshman",
    major: "",
    grad_year: new Date().getFullYear(),
    // Preferences / Interests
    interests: [],
    intent: "",
    genderPreference: "All",
    sexualOrientation: "Straight",
    min_age: 18,
    max_age: 25,
    // Photos
    photos: [],
    // Social Links (optional)
    spotify_url: undefined,
    instagram_url: undefined,
  });

  const step = (stepParam as Step) || "step0";
  const isValidStep = STEPS.includes(step);

  // Update profile data helper
  const updateProfileData = useCallback(
    (data: Partial<ProfileSetupData>) => {
      setProfileData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  // Complete profile setup
  const handleComplete = useCallback(async () => {
    try {
      console.log("Profile setup complete:", profileData);
      router.replace("/");
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }, [profileData, router]);

  // Navigate to specific step
  const goToStep = useCallback(
    (nextStep: Step) => {
      router.push(`/profile-setup/${nextStep}`);
    },
    [router]
  );

  // Go to next step
  const goToNextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1]);
    } else {
      handleComplete();
    }
  }, [step, goToStep, handleComplete]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1]);
    }
  }, [step, goToStep]);

  // Redirect if invalid step
  useEffect(() => {
    if (!isValidStep) {
      router.replace("/profile-setup/step0");
    }
  }, [isValidStep, router]);

  // Render each step component
  const renderStep = () => {
    switch (step) {
      case "step0":
        return <Step0 onNext={goToNextStep} />;
      case "step1":
        return <Step1 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step2":
        return <Step2 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step3":
        return <Step3 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step4":
        return <Step4 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step5":
        return <Step5 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step6":
        return <Step6 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep} onBack={goToPreviousStep} />;
      case "step7":
        return <Step7 data={profileData} onUpdate={updateProfileData} onNext={handleComplete} onBack={goToPreviousStep} />;
      default:
        return null;
    }
  };

  if (!isValidStep) return null;

  // Progress calculation (exclude step0)
  const totalSteps = STEPS.length - 1;
  const currentStepIndex = step === "step0" ? 0 : STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress bar */}
        {step !== "step0" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Step {currentStepIndex} of {totalSteps}
              </Text>
              <Text style={styles.progressText}>
                {Math.round((currentStepIndex / totalSteps) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStepIndex / totalSteps) * 100}%` }]} />
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
  container: { flex: 1, backgroundColor: BACKGROUND },
  content: { flex: 1 },
  progressContainer: { paddingHorizontal: 24, paddingVertical: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressText: { fontSize: 14, color: DARK },
  progressBar: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 9999 },
  progressFill: { height: 8, backgroundColor: PRIMARY, borderRadius: 9999 },
  stepContent: { flex: 1 },
});
