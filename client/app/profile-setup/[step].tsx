import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

// Step components
import WelcomeStep from '../../components/profile-setup/WelcomeStep';
import BasicInfoStep from '../../components/profile-setup/BasicInfoStep';
import PreferencesStep from '../../components/profile-setup/PreferencesStep';
// import MoreInfoStep from '../../components/profile-setup/MoreInfoStep';
// import InterestsStep from '../../components/profile-setup/InterestsStep';
// import SocialsStep from '../../components/profile-setup/SocialsStep';
// import ReviewStep from '../../components/profile-setup/ReviewStep';

// basicInfo (Name, Age, Gender, Campus, School, Major, SchoolYear, GradYear)
// pref (Pronouns, Intent, MinAge, MaxAge, GenderPreference, LocationPreference)
// moreInfo (Bio, ProfilePicture)
// interests (Interests, Hobbies, Activities)
// otherSocials (Instagram, Snapchat, TikTok, Twitter, Facebook)
// review (Review all information before submission)
const STEPS = ['welcome', 'basicInfo', 'pref', 'moreInfo', 'interests', 'otherSocials', 'review'];

export interface ProfileSetupData {
  // Basic Info
  name: string;
  age: number;
  gender: string;
  campus: string;
  school: string;
  major: string;
  schoolYear: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  gradYear: string;
  
  // Preferences
  pronouns: string;
  intent: string[];
  minAge: number;
  maxAge: number;
  sexualOrientation: 'Straight' | 'Gay' | 'Lesbian' |'Bisexual' | 'Questioning' | 'Other';
  genderPreference: 'Men' | 'Women' | 'Non-binary' | 'All';
  locationPreference: string;
  
  // More Info
  bio: string;
  profilePicture: string;
  
  // Interests
  interests: string[];
  hobbies: string[];
  activities: string[];
  
  // Other Socials
  instagram: string;
  snapchat: string;
  tiktok: string;
  twitter: string;
  facebook: string;
}

export default function ProfileSetupStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: '',
    age: 0,
    gender: '',
    campus: '',
    school: '',
    major: '',
    schoolYear: 'Freshman',
    gradYear: '',
    pronouns: '',
    intent: [],
    minAge: 18,
    maxAge: 26,
    sexualOrientation: 'Straight',
    genderPreference: 'All',
    locationPreference: '',
    bio: '',
    profilePicture: '',
    interests: [],
    hobbies: [],
    activities: [],
    instagram: '',
    snapchat: '',
    tiktok: '',
    twitter: '',
    facebook: '',
  });

  const currentStepIndex = STEPS.indexOf(step || 'welcome');
  const isValidStep = currentStepIndex !== -1;

  useEffect(() => {
    if (!isValidStep) {
      router.replace('/profile-setup/welcome');
    }
  }, [step, isValidStep, router]);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      router.push(`/profile-setup/${STEPS[nextIndex]}`);
    } else {
      // Profile setup complete
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      router.push(`/profile-setup/${STEPS[prevIndex]}`);
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Save profile data to backend
      console.log('Profile setup complete:', profileData);
      
      // Navigate to main app
      router.replace('/');
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const updateProfileData = (data: Partial<ProfileSetupData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onNext={goToNextStep} />;
      case 'basicInfo':
        return (
          <BasicInfoStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'pref':
        return (
          <PreferencesStep
            data={profileData}
            onUpdate={updateProfileData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
    //   case 'moreInfo':
    //     return (
    //       <MoreInfoStep
    //         data={profileData}
    //         onUpdate={updateProfileData}
    //         onNext={goToNextStep}
    //         onBack={goToPreviousStep}
    //       />
    //     );
    //   case 'interests':
    //     return (
    //       <InterestsStep
    //         data={profileData}
    //         onUpdate={updateProfileData}
    //         onNext={goToNextStep}
    //         onBack={goToPreviousStep}
    //       />
    //     );
    //   case 'otherSocials':
    //     return (
    //       <SocialsStep
    //         data={profileData}
    //         onUpdate={updateProfileData}
    //         onNext={goToNextStep}
    //         onBack={goToPreviousStep}
    //       />
    //     );
    //   case 'review':
    //     return (
    //       <ReviewStep
    //         data={profileData}
    //         onComplete={handleComplete}
    //         onBack={goToPreviousStep}
    //       />
    //     );
      default:
        return null;
    }
  };

  if (!isValidStep) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Progress bar */}
        {step !== 'welcome' && (
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">
                Step {currentStepIndex} of {STEPS.length - 1}
              </Text>
              <Text className="text-sm text-gray-500">
                {Math.round((currentStepIndex / (STEPS.length - 1)) * 100)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full">
              <View 
                className="h-2 bg-pink-500 rounded-full"
                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
              />
            </View>
          </View>
        )}

        {/* Step content */}
        <View className="flex-1">
          {renderStep()}
        </View>
      </View>
    </SafeAreaView>
  );
}



