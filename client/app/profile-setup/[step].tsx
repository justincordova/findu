// React core
import React, { useCallback, useState } from "react";

// React Native
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import Button from "@/components/shared/Button";
import Step1 from "@/components/profile-setup/Step1";
import Step2 from "@/components/profile-setup/Step2";
import Step3 from "@/components/profile-setup/Step3";
import Step4 from "@/components/profile-setup/Step4";
import Step5 from "@/components/profile-setup/Step5";
import Step6 from "@/components/profile-setup/Step6";
import Step7 from "@/components/profile-setup/Step7";
import Step8Lifestyle from "@/components/profile-setup/Step8Lifestyle";
import Step9 from "@/components/profile-setup/Step9";
import Step10 from "@/components/profile-setup/Step10";
import { BACKGROUND, DARK, PRIMARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Constants
const STEPS = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step7",
  "step8",
  "step9",
  "step10",
] as const;
type Step = (typeof STEPS)[number];
const PROGRESS_BAR_HEIGHT = 8;
const PROGRESS_BORDER_RADIUS = 9999;
const PADDING_VERTICAL = 16;
const CONTENT_PADDING_HORIZONTAL = 24;

/**
 * Multi-step profile setup wizard
 * Guides users through 10 steps to complete their profile
 * Displays progress indicator and validates each step before advancing
 */

/** Check if all required profile fields are filled */
function isProfileComplete(data: any): boolean {
  if (!data) return false;

  const requiredFields = [
    'name',
    'birthdate',
    'gender',
    'pronouns',
    'university_name',
    'major',
    'university_year',
    'grad_year',
    'sexual_orientation',
    'gender_preference',
    'intent',
    'min_age',
    'max_age',
    'avatar_url',
    'bio',
    'interests',
    'photos',
  ];

  return requiredFields.every((field) => {
    const value = data[field];

    // Handle arrays (interests, photos, gender_preference)
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    // Handle strings and numbers
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    return !!value;
  });
}

export default function ProfileSetupStep() {
  const [currentStep, setCurrentStep] = useState<Step>("step1");
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  // Access profile setup store
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  // Navigate to next step (validates current step is valid first)
  const goToNextStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1]);
    setIsCurrentStepValid(false);
  }, [currentStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
    setIsCurrentStepValid(true);
  }, [currentStep]);

  // Navigate to a specific step (used by Step9)
  const goToStep = useCallback((step: string) => {
    if (STEPS.includes(step as Step)) {
      setCurrentStep(step as Step);
      setIsCurrentStepValid(true);
    }
  }, []);

  const stepProps = {
    data: profileData,
    onUpdate: setProfileField,
    onNext: goToNextStep,
    onValidityChange: setIsCurrentStepValid,
    goToStep: goToStep,
  };

  const renderStep = () => {
    switch (currentStep) {
      case "step1":
        return <Step1 {...stepProps} />;
      case "step2":
        return <Step2 {...stepProps} />;
      case "step3":
        return <Step3 {...stepProps} />;
      case "step4":
        return <Step4 {...stepProps} />;
      case "step5":
        return <Step5 {...stepProps} />;
      case "step6":
        return <Step6 {...stepProps} />;
      case "step7":
        return <Step7 {...stepProps} />;
      case "step8":
        return <Step8Lifestyle {...stepProps} />;
      case "step9":
        return <Step9 {...stepProps} />;
      case "step10":
        return <Step10 {...stepProps} />;
      default:
        return null;
    }
  };

  const totalSteps = STEPS.length;
  const currentStepIndex = STEPS.indexOf(currentStep) + 1;
  const profileComplete = isProfileComplete(profileData);
  const canGoToFinish = profileComplete || currentStep === "step10";

  const handleGoToFinish = useCallback(() => {
    setCurrentStep("step10");
    setIsCurrentStepValid(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressText}>
                Step {currentStepIndex} of {totalSteps}
              </Text>
              <Text style={styles.progressText}>
                {Math.round((currentStepIndex / totalSteps) * 100)}%
              </Text>
            </View>
            {canGoToFinish && currentStep !== "step9" && (
              <TouchableOpacity
                onPress={handleGoToFinish}
                style={styles.finishButton}
                activeOpacity={0.7}
              >
                <Text style={styles.finishButtonText}>Go to Finish</Text>
                <Ionicons name="arrow-forward" size={16} color="white" style={styles.finishButtonIcon} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStepIndex / totalSteps) * 100}%` },
              ]}
            />
          </View>

          {/* Back button below progress bar */}
          {currentStepIndex > 1 && (
            <TouchableOpacity
              onPress={goToPreviousStep}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={DARK} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Wrap step content to allow dropdowns to expand */}
          <View style={styles.stepContentWrapper}>{renderStep()}</View>

          {currentStep !== "step10" && (
            <Button
              label={currentStep === "step1" ? "Get Started" : "Continue"}
              onPress={goToNextStep}
              disabled={currentStep !== "step1" && !isCurrentStepValid}
              type={isCurrentStepValid ? "gradient" : "outline"}
              style={{ marginVertical: 16 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: CONTENT_PADDING_HORIZONTAL, paddingBottom: 32 },
  progressContainer: {
    paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
    paddingVertical: PADDING_VERTICAL,
    paddingBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  progressBar: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "#E5E7EB",
    borderRadius: PROGRESS_BORDER_RADIUS,
    overflow: "hidden",
  },
  progressFill: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: PRIMARY,
    borderRadius: PROGRESS_BORDER_RADIUS,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: DARK,
  },
  // Wrapper for step content with z-index for dropdowns
  stepContentWrapper: {
    position: "relative",
    zIndex: 1,
    overflow: "visible",
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    gap: 6,
  },
  finishButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  finishButtonIcon: {
    marginLeft: 4,
  },
});
