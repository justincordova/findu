import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, BACKGROUND } from "../../constants/theme";
import { ProfileSetupData } from "../../types/ProfileSetupData";

// Import each step component
import Step0 from "../../components/profile-setup/Step0";
import Step1 from "../../components/profile-setup/Step1";
import Step2 from "../../components/profile-setup/Step2";
import Step3 from "../../components/profile-setup/Step3";
import Step4 from "../../components/profile-setup/Step4";
import Step5 from "../../components/profile-setup/Step5";
import Step6 from "../../components/profile-setup/Step6";
import Step7 from "../../components/profile-setup/Step7";

// Define all step identifiers in order
const STEPS = ["step0","step1","step2","step3","step4","step5","step6","step7"] as const;
type Step = (typeof STEPS)[number];

export default function ProfileSetupStep() {
  const { step: stepParam } = useLocalSearchParams(); // Get step from URL query
  const router = useRouter(); // Expo Router for navigation

  // Store the full profile data for all steps
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: "",
    avatar_url: "",
    age: 18,
    birthdate: "",
    gender: "Male",
    pronouns: "",
    bio: "",
    university: "",
    university_year: "Freshman",
    major: "",
    grad_year: new Date().getFullYear(),
    interests: [],
    intent: "",
    genderPreference: "All",
    sexualOrientation: "Straight",
    min_age: 18,
    max_age: 25,
    photos: [],
    spotify_url: undefined,
    instagram_url: undefined,
  });

  const step = (stepParam as Step) || "step0"; // Default to step0 if not set
  const isValidStep = STEPS.includes(step); // Validate current step

  // Memoized function to update profile data partially
  const updateProfileData = useCallback(
    (data: Partial<ProfileSetupData>) => {
      setProfileData(prev => ({ ...prev, ...data }));
    },
    []
  );

  // Called when the final step is completed
  const handleComplete = useCallback(async () => {
    try {
      console.log("Profile setup complete:", profileData);
      router.replace("/"); // Redirect to home page
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }, [profileData, router]);

  // Navigate to a specific step
  const goToStep = useCallback(
    (nextStep: Step) => {
      router.push(`/profile-setup/${nextStep}`);
    },
    [router]
  );

  // Navigate to the next step, or finish if on last step
  const goToNextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1]);
    } else {
      handleComplete();
    }
  }, [step, goToStep, handleComplete]);

  // Redirect to step0 if an invalid step is in the URL
  useEffect(() => {
    if (!isValidStep) {
      router.replace("/profile-setup/step0");
    }
  }, [isValidStep, router]);

  // Render the current step component with necessary props
  const renderStep = useMemo(() => {
    switch (step) {
      case "step0": return <Step0 onNext={goToNextStep} />;
      case "step1": return <Step1 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step2": return <Step2 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step3": return <Step3 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step4": return <Step4 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step5": return <Step5 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step6": return <Step6 data={profileData} onUpdate={updateProfileData} onNext={goToNextStep}/>;
      case "step7": return <Step7 data={profileData} onNext={handleComplete}/>;
      default: return null;
    }
  }, [step, profileData, updateProfileData, goToNextStep, handleComplete]);

  if (!isValidStep) return null;

  const totalSteps = STEPS.length - 1;
  const currentStepIndex = step === "step0" ? 0 : STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress bar shown for all steps except step0 */}
        {step !== "step0" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Step {currentStepIndex} of {totalSteps}</Text>
              <Text style={styles.progressText}>{Math.round((currentStepIndex / totalSteps) * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStepIndex / totalSteps) * 100}%` }]} />
            </View>
          </View>
        )}
        {/* Render the current step */}
        <View style={styles.stepContent}>{renderStep}</View>
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
