import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={64} color="#ec4899" />
        </View>
        
        <Text style={styles.title}>
          Welcome to FindU
        </Text>
        
        <Text style={styles.subtitle}>
          Find your college sweet heart
        </Text>
        
        <Text style={styles.description}>
          Let&apos;s get started and set up your profile
        </Text>
      </View>

      {/* <View style={styles.features}>
        <View style={styles.feature}>
          <Ionicons name="school" size={24} color="#6b7280" />
          <Text style={styles.featureText}>University verified profiles</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="shield-checkmark" size={24} color="#6b7280" />
          <Text style={styles.featureText}>Safe and secure matching</Text>
        </View>
        
        <View style={styles.feature}>
          <Ionicons name="people" size={24} color="#6b7280" />
          <Text style={styles.featureText}>Campus-only community</Text>
        </View>
      </View> */}

      <TouchableOpacity 
        onPress={onNext}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 128,
    height: 128,
    backgroundColor: '#fce7f3',
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  features: {
    width: '100%',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  featureText: {
    marginLeft: 12,
    color: '#374151',
  },
  button: {
    width: '100%',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 48,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
