import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RangeSlider from 'rn-range-slider';
import { ProfileSetupData } from '../../app/profile-setup/[step]';
import { useCallback } from 'react';

interface PreferencesStepProps {
    data: ProfileSetupData;
    onUpdate: (data: Partial<ProfileSetupData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function PreferencesStep({ data, onUpdate, onNext, onBack }: PreferencesStepProps) {
  const toggleIntent = useCallback((intent: string) => {
    const currentIntents = data.intent || [];
    let newIntents;
    
    if (currentIntents.includes(intent)) {
      newIntents = currentIntents.filter(i => i !== intent);
    } else {
      newIntents = [...currentIntents, intent];
    }
    
    onUpdate({ intent: newIntents });
  }, [data.intent, onUpdate]);

  const isIntentSelected = useCallback((intent: string) => {
    const currentIntents = data.intent || [];
    return currentIntents.includes(intent);
  }, [data.intent]);

  const handleSliderChange = useCallback((low: number, high: number) => {
    if (data.minAge !== low || data.maxAge !== high) {
      onUpdate({
        minAge: low,
        maxAge: high
      });
    }
  }, [data.minAge, data.maxAge, onUpdate]);

  const handleFirstPronounChange = useCallback((text: string) => {
    const secondPart = data.pronouns?.split('/')[1] || '';
    onUpdate({ pronouns: `${text}/${secondPart}` });
  }, [data.pronouns, onUpdate]);

  const handleSecondPronounChange = useCallback((text: string) => {
    const firstPart = data.pronouns?.split('/')[0] || '';
    onUpdate({ pronouns: `${firstPart}/${text}` });
  }, [data.pronouns, onUpdate]);

  const renderThumb = useCallback(() => <View style={styles.thumb} />, []);
  const renderRail = useCallback(() => <View style={styles.railBackground} />, []);
  const renderRailSelected = useCallback(() => <View style={styles.railSelected} />, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={styles.title}>More Information</Text>
        <Text style={styles.subtitle}>Tell us more</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Pronouns */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Pronouns </Text>
          <View style={styles.pronounContainer}>
            <TextInput
              style={styles.pronounInput}
              placeholder="they"
              value={data.pronouns?.split('/')[0] || ''}
              onChangeText={handleFirstPronounChange}
              maxLength={10}
            />
            <Text style={styles.pronounSlash}>/</Text>
            <TextInput
              style={styles.pronounInput}
              placeholder="them"
              value={data.pronouns?.split('/')[1] || ''}
              onChangeText={handleSecondPronounChange}
              maxLength={10}
            />
          </View>
        </View>

        {/* Intent */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Looking for</Text>
          <View style={styles.intentContainer}>
            {['True Love', 'Club Partner', 'Study Buddy', 'Not Sure'].map((intent) => (
              <TouchableOpacity
                key={intent}
                onPress={() => toggleIntent(intent)}
                style={[
                  styles.intentBox,
                  isIntentSelected(intent) && styles.intentBoxSelected
                ]}
              >
                <Text style={[
                  styles.intentText,
                  isIntentSelected(intent) && styles.intentTextSelected
                ]}>
                  {intent}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age Range */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Age Range</Text>
          <View style={styles.ageRangeContainer}>
            <Text style={styles.ageRangeDisplay}>
              {data.minAge || 18} - {data.maxAge || 26} years old
            </Text>
            
            <View style={styles.rangeSliderContainer}>
              <View style={styles.sliderBox}>
                <RangeSlider
                  style={styles.rangeSlider}
                  min={18}
                  max={26}
                  step={1}
                  low={data.minAge || 18}
                  high={data.maxAge || 26}
                  onValueChanged={handleSliderChange}
                  renderThumb={renderThumb}
                  renderRail={renderRail}
                  renderRailSelected={renderRailSelected}
                />
              </View>
              
              <Text style={styles.sliderDescription}>
                Drag the handles to set your preferred age range
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  picker: {
    height: 50,
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