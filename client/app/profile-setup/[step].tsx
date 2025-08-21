import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIMARY, DARK, BACKGROUND, MUTED } from "../../constants/theme";

import Step1 from "../../components/profile-setup/Step1";
import Step2 from "../../components/profile-setup/Step2";
import Step3 from "../../components/profile-setup/Step3";
import Step4 from "../../components/profile-setup/Step4";
import Step5 from "../../components/profile-setup/Step5";
import Step6 from "../../components/profile-setup/Step6";
import Step7 from "../../components/profile-setup/Step7";

import { useProfileSetupStore } from "../../store/profileSetupStore";

const STEPS = ["step1","step2","step3","step4","step5","step6","step7"] as const;
type Step = (typeof STEPS)[number];

export default function ProfileSetupStep() {
  const [currentStep, setCurrentStep] = useState<Step>("step1");
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  // access store
  const profileData = useProfileSetupStore(state => state.data);
  const setField = useProfileSetupStore(state => state.setField);

  const goToNextStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx+1]);
    setIsCurrentStepValid(false);
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx-1]);
    setIsCurrentStepValid(true);
  }, [currentStep]);

  const stepProps = {
    data: profileData,
    onUpdate: setField,
    onNext: goToNextStep,
    onBack: goToPreviousStep,
    onValidityChange: setIsCurrentStepValid,
  };

  const renderStep = () => {
    switch(currentStep){
      case "step1": return <Step1 {...stepProps} />;
      case "step2": return <Step2 {...stepProps} />;
      case "step3": return <Step3 {...stepProps} />;
      case "step4": return <Step4 {...stepProps} />;
      case "step5": return <Step5 {...stepProps} />;
      case "step6": return <Step6 {...stepProps} />;
      case "step7": return <Step7 {...stepProps} />;
      default: return null;
    }
  };

  const totalSteps = STEPS.length;
  const currentStepIndex = STEPS.indexOf(currentStep) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Step {currentStepIndex} of {totalSteps}</Text>
            <Text style={styles.progressText}>{Math.round((currentStepIndex / totalSteps)*100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width:`${(currentStepIndex/totalSteps)*100}%` }]} />
          </View>
        </View>

        {/* Wrap step content to allow dropdowns to expand */}
        <View style={styles.stepContentWrapper}>
          {renderStep()}
        </View>

        {currentStep !== "step7" && (
          <TouchableOpacity
            onPress={goToNextStep}
            disabled={!isCurrentStepValid}
            style={[styles.button, { backgroundColor: isCurrentStepValid ? PRIMARY : MUTED }]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: BACKGROUND },
  content: { flex:1, paddingHorizontal: 24 },
  progressContainer: { paddingVertical: 16 },
  progressHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  progressText: { fontSize:14, color:DARK },
  progressBar: { height:8, backgroundColor:"#E5E7EB", borderRadius:9999 },
  progressFill: { height:8, backgroundColor:PRIMARY, borderRadius:9999 },
  
  // Updated wrapper for dropdowns
  stepContentWrapper: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    overflow: "visible",
  },

  button: { 
    width:"100%", 
    paddingVertical:16, 
    borderRadius:12, 
    marginVertical:16, 
    justifyContent:"center", 
    alignItems:"center" 
  },
  buttonText: { color:"white", fontSize:18, fontWeight:"600" },
});
