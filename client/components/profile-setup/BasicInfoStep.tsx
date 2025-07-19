import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ProfileSetupData } from '../../app/profile-setup/[step]';

interface BasicInfoStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other'];
const SCHOOL_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const GRADUATION_YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'];

export default function BasicInfoStep({ data, onUpdate, onNext, onBack }: BasicInfoStepProps) {
  // const canContinue = data.name && data.age && data.gender && data.school && data.major && data.schoolYear && data.gradYear;
  const canContinue = true;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={data.name}
            onChangeText={(text) => onUpdate({ name: text })}
            maxLength={50}
          />
        </View>

        {/* Age */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={data.age ? data.age.toString() : ''}
            onChangeText={(text) => onUpdate({ age: parseInt(text) || 0 })}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={data.gender}
              onValueChange={(value) => onUpdate({ gender: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select gender" value="" />
              {GENDERS.map((gender) => (
                <Picker.Item key={gender} label={gender} value={gender} />
              ))}
            </Picker>
          </View>
        </View>

        {/* School */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>University/School *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your university name"
            value={data.school}
            onChangeText={(text) => onUpdate({ school: text })}
            maxLength={100}
          />
        </View>

        {/* Campus */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Campus</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Main Campus, North Campus"
            value={data.campus}
            onChangeText={(text) => onUpdate({ campus: text })}
            maxLength={100}
          />
        </View>

        {/* Major */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Major *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your major"
            value={data.major}
            onChangeText={(text) => onUpdate({ major: text })}
            maxLength={100}
          />
        </View>

        {/* School Year */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>School Year *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={data.schoolYear}
              onValueChange={(value) => onUpdate({ schoolYear: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select year" value="" />
              {SCHOOL_YEARS.map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Graduation Year */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Expected Graduation Year *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={data.gradYear}
              onValueChange={(value) => onUpdate({ gradYear: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select graduation year" value="" />
              {GRADUATION_YEARS.map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>
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
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  picker: {
    height: 50,
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
});
