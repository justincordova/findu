import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSetupData } from '../../app/profile-setup/[step]';

interface ReviewStepProps {
    data: ProfileSetupData;
    onUpdate: (data: Partial<ProfileSetupData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function ReviewStep({ data, onUpdate, onNext, onBack }: ReviewStepProps) {
  const router = useRouter();
  const canContinue = true;

  const fieldToStep: { [key: string]: string } = {
    name: 'basicInfo',
    age: 'basicInfo',
    gender: 'basicInfo',
    campus: 'basicInfo',
    school: 'basicInfo',
    major: 'basicInfo',
    schoolYear: 'basicInfo',
    gradYear: 'basicInfo',
    pronouns: 'pref',
    intent: 'pref',
    minAge: 'pref',
    maxAge: 'pref',
    sexualOrientation: 'pref',
    genderPreference: 'pref',
    bio: 'moreInfo',
    profilePicture: 'moreInfo',
  };

  const goToStep = (step: string) => {
    router.push(`/profile-setup/${step}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Review your profile</Text>
        <Text style={styles.subtitle}>Click the item to go back to edit</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <Text style={styles.label}>Basic Info</Text>
        {['name','age','gender','campus','school','major','schoolYear','gradYear'].map((field) => (
          <TouchableOpacity key={field} style={styles.fieldContainer} onPress={() => goToStep(fieldToStep[field])}>
            <Text style={styles.input}>{field.charAt(0).toUpperCase() + field.slice(1)}: {String(data[field as keyof ProfileSetupData])}</Text>
          </TouchableOpacity>
        ))}
        {/* Preferences */}
        <Text style={styles.label}>Preferences</Text>
        {['pronouns','intent','minAge','maxAge','sexualOrientation','genderPreference'].map((field) => (
          <TouchableOpacity key={field} style={styles.fieldContainer} onPress={() => goToStep(fieldToStep[field])}>
            <Text style={styles.input}>{field.charAt(0).toUpperCase() + field.slice(1)}: {Array.isArray(data[field as keyof ProfileSetupData]) ? (data[field as keyof ProfileSetupData] as string[]).join(', ') : String(data[field as keyof ProfileSetupData])}</Text>
          </TouchableOpacity>
        ))}
        {/* More Info */}
        <Text style={styles.label}>More Info</Text>
        <TouchableOpacity style={styles.fieldContainer} onPress={() => goToStep('moreInfo')}>
          <Text style={styles.input}>Bio: {data.bio}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fieldContainer} onPress={() => goToStep('moreInfo')}>
          <Text style={styles.input}>Profile Picture:</Text>
          {data.profilePicture ? (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Tap to edit</Text>
              <View style={{ borderRadius: 60, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' }}>
                <View>
                  <Text style={{ textAlign: 'center', color: '#374151', fontSize: 12 }}>Image Preview</Text>
                  <View style={{ alignItems: 'center', marginVertical: 8 }}>
                    <Text style={{ color: '#ec4899', fontSize: 12 }}>Image URI:</Text>
                    <Text style={{ color: '#374151', fontSize: 10 }}>{data.profilePicture}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ color: '#6b7280', fontSize: 12 }}>No image selected</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
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
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdown: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
    zIndex: 2000,
  },
  dropdownContainer: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    zIndex: 2000,
  },
  pronounContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pronounInput: {
    minWidth: 80,
    maxWidth: 240,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    textAlign: 'center',
  },
  pronounSlash: {
    fontSize: 18,
    color: '#6b7280',
    marginHorizontal: 12,
    fontWeight: 'bold',
  },
  intentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  intentBox: {
    flex: 1,
    minWidth: '22%',
    height: 48,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentBoxSelected: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  intentText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
    justifyContent: 'center',
  },
  intentTextSelected: {
    color: '#ec4899',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#6b7280',
  },
  ageRangeContainer: {
    gap: 16,
  },
  ageSliderContainer: {
    marginBottom: 16,
  },
  ageLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ec4899',
    textAlign: 'center',
  },
  singleSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  rangeSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeSlider: {
    width: '100%',
    height: 20,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000000',
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
    backgroundColor: '#e5e7eb',
  },
  railBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    width: '100%',
  },
  railSelected: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ec4899',
  },
});