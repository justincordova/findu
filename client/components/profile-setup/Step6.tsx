import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY } from "../../constants/theme";

interface Step6Props {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step6({ data, onUpdate, onNext, onBack }: Step6Props) {
  const canContinue = (data.photos?.length || 0) > 0;

  const pickImage = async () => {
    if ((data.photos?.length || 0) >= 6) return;

    const result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      onUpdate({ photos: [...(data.photos || []), uri] });
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = [...(data.photos || [])];
    updatedPhotos.splice(index, 1);
    onUpdate({ photos: updatedPhotos });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add up to 6 photos for your profile</Text>
      </View>

      <ScrollView
        style={styles.form}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosContainer}
      >
        {(data.photos || []).map((uri, idx) => (
          <View key={idx} style={styles.photoWrapper}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePhoto(idx)}
            >
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {(data.photos?.length || 0) < 6 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="add" size={36} color={PRIMARY} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
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
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { marginBottom: 32 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: DARK, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: MUTED, textAlign: "center", marginBottom: 16 },
  form: { flex: 1 },
  photosContainer: { alignItems: "center", gap: 16 },
  photoWrapper: { position: "relative", marginRight: 16 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  removeButton: { position: "absolute", top: -8, right: -8 },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: { fontSize: 12, color: PRIMARY, marginTop: 4, textAlign: "center" },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonDisabled: { backgroundColor: "#d1d5db" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
  buttonTextDisabled: { color: MUTED },
});
