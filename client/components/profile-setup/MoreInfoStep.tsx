import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../app/profile-setup/[step]";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface MoreInfoStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function MoreInfoStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: MoreInfoStepProps) {
  const canContinue = true;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      onUpdate({ profilePicture: asset.uri });
    }
  };

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
        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Bio (500 character limit)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Bio"
            value={data.bio}
            onChangeText={(text) => onUpdate({ bio: text })}
            maxLength={500}
            multiline={true}
            textAlignVertical="top"
            placeholderTextColor={styles.placeholderStyle.color}
          />
        </View>

        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity style={styles.button} onPress={handlePickImage}>
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>
          {data.profilePicture ? (
            <Image
              source={{ uri: data.profilePicture }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                marginTop: 12,
                alignSelf: "center",
              }}
            />
          ) : null}
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={onNext}
        disabled={!canContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text
          style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}
        >
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
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    textAlign: "center",
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
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    maxHeight: 200,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pickerContainer: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  picker: {
    height: 50,
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  // Shared placeholder style for dropdowns and text inputs
  placeholderStyle: {
    color: MUTED,
    fontWeight: "400",
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: MUTED,
  },
});
