import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProfileSetupData } from "../../types/ProfileSetupData";
import { DARK, MUTED, PRIMARY } from "../../constants/theme";

interface ReviewStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: ReviewStepProps) {
  const router = useRouter();

  const fieldToStep: { [key: string]: string } = {
    name: "step1",
    age: "step1",
    gender: "step1",
    pronouns: "step2",
    intent: "step2",
    min_age: "step2",
    max_age: "step2",
    sexualOrientation: "step2",
    genderPreference: "step2",
    bio: "step3",
    avatar_url: "step3",
    photos: "step6",
  };

  const goToStep = (step: string) => router.push(`/profile-setup/${step}`);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={MUTED} />
        </TouchableOpacity>
        <Text style={styles.title}>Review your profile</Text>
        <Text style={styles.subtitle}>Tap any item to edit</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        {["name", "age", "gender", "pronouns"].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}:</Text>
            <Text style={styles.infoValue}>
              {String(data[field as keyof ProfileSetupData])}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        {["intent", "min_age", "max_age", "sexualOrientation", "genderPreference"].map((field) => (
          <TouchableOpacity
            key={field}
            style={styles.infoRow}
            onPress={() => goToStep(fieldToStep[field])}
          >
            <Text style={styles.infoLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}:</Text>
            <Text style={styles.infoValue}>
              {Array.isArray(data[field as keyof ProfileSetupData])
                ? (data[field as keyof ProfileSetupData] as string[]).join(", ")
                : String(data[field as keyof ProfileSetupData])}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Bio */}
        <Text style={styles.sectionTitle}>Bio</Text>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => goToStep("step3")}
        >
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoValue}>{data.bio}</Text>
        </TouchableOpacity>

        {/* Profile Avatar */}
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <TouchableOpacity style={styles.infoRow} onPress={() => goToStep("step3")}>
          {data.avatar_url ? (
            <Image source={{ uri: data.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={{ color: MUTED }}>No avatar selected</Text>
          )}
        </TouchableOpacity>

        {/* Photos */}
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosContainer}>
          {(data.photos || []).map((uri, idx) => (
            <TouchableOpacity key={idx} onPress={() => goToStep("step6")}>
              <Image source={{ uri }} style={styles.photo} />
            </TouchableOpacity>
          ))}
          {(data.photos || []).length === 0 && <Text style={{ color: MUTED }}>No photos added</Text>}
        </ScrollView>
      </ScrollView>

      <TouchableOpacity
        onPress={onNext}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Finish</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: "600", color: DARK, marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  infoLabel: { fontSize: 14, color: MUTED, fontWeight: "500" },
  infoValue: { fontSize: 14, color: DARK, fontWeight: "500" },
  avatar: { width: 100, height: 100, borderRadius: 12 },
  photosContainer: { flexDirection: "row", gap: 12 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  button: { width: "100%", backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600", textAlign: "center" },
});
