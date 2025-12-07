// React core
import React, { useCallback, useState } from "react";

// React Native
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

// Project imports
import Button from "@/components/shared/Button";
import Step1 from "@/components/profile-setup/Step1";
import Step2 from "@/components/profile-setup/Step2";
import Step3 from "@/components/profile-setup/Step3";
import Step4 from "@/components/profile-setup/Step4";
import Step5 from "@/components/profile-setup/Step5";
import Step6 from "@/components/profile-setup/Step6";
import Step7 from "@/components/profile-setup/Step7";
import Step8 from "@/components/profile-setup/Step8";
import Step9 from "@/components/profile-setup/Step9";
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
] as const;
type Step = (typeof STEPS)[number];
const PROGRESS_BAR_HEIGHT = 8;
const PROGRESS_BORDER_RADIUS = 9999;
const PADDING_VERTICAL = 16;
const CONTENT_PADDING_HORIZONTAL = 24;

/**
 * Multi-step profile setup wizard
 * Guides users through 9 steps to complete their profile
 * Displays progress indicator and validates each step before advancing
 */

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

  const stepProps = {
    data: profileData,
    onUpdate: setProfileField,
    onNext: goToNextStep,
    onBack: goToPreviousStep,
    onValidityChange: setIsCurrentStepValid,
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
        return <Step8 {...stepProps} />;
      case "step9":
        return <Step9 {...stepProps} />;
      default:
        return null;
    }
  };

  const totalSteps = STEPS.length;
  const currentStepIndex = STEPS.indexOf(currentStep) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStepIndex / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Wrap step content to allow dropdowns to expand */}
        <View style={styles.stepContentWrapper}>{renderStep()}</View>

        {currentStep !== "step9" && (
          <Button
            label={currentStep === "step1" ? "Get Started" : "Continue"}
            onPress={goToNextStep}
            disabled={currentStep !== "step1" && !isCurrentStepValid}
            type={isCurrentStepValid ? "gradient" : "outline"}
            style={{ marginVertical: 16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  content: { flex: 1, paddingHorizontal: CONTENT_PADDING_HORIZONTAL },
  progressContainer: { paddingVertical: PADDING_VERTICAL },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: { fontSize: 14, color: DARK },
  progressBar: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "#E5E7EB",
    borderRadius: PROGRESS_BORDER_RADIUS,
  },
  progressFill: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: PRIMARY,
    borderRadius: PROGRESS_BORDER_RADIUS,
  },
  // Wrapper for step content with z-index for dropdowns
  stepContentWrapper: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    overflow: "visible",
  },
});
