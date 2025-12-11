// React core
import { useCallback, useEffect, useMemo, useState } from "react";

// React Native
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import {
  BACKGROUND,
  DARK,
  MUTED,
  PRIMARY,
  SECONDARY,
  SUCCESS,
} from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Types
interface Step6Props {
  onValidityChange?: (isValid: boolean) => void;
}

/**
 * Step 6: Bio and interests - write bio and select interests
 */
export default function Step6({
  onValidityChange,
}: Step6Props) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  const [photoUploaded, setPhotoUploaded] = useState(false);

  /** Pick image from library */
  const pickImage = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setProfileField("avatar_url", uri);
      setPhotoUploaded(true);
      setTimeout(() => setPhotoUploaded(false), 2000); // hide indicator after 2s
    }
  }, [setProfileField]);

  /** Step validity: require profile picture, bio */
  const isValid = useMemo(
    () =>
      !!profileData?.avatar_url &&
      !!profileData?.bio?.trim(),
    [profileData?.avatar_url, profileData?.bio]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Details</Text>
      <Text style={styles.subtitle}>
        Add a bio and profile picture
      </Text>

        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelWithCheckmark}>
            <Text style={styles.label}>Profile Picture</Text>
            {profileData?.avatar_url && (
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark-circle" size={18} color={SUCCESS} />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.uploadButtonText}>
              {profileData?.avatar_url ? "Change Photo" : "Upload Photo"}
            </Text>
          </TouchableOpacity>
          {photoUploaded && (
            <Text style={styles.uploadSuccess}>Uploaded ✓</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelWithCheckmark}>
            <Text style={styles.label}>Bio</Text>
          </View>
          <TextInput
            style={[
              styles.bioInput,
              profileData?.bio?.trim() && styles.bioInputCompleted,
            ]}
            placeholder="Tell us about yourself..."
            value={profileData?.bio ?? ""}
            onChangeText={(text) => setProfileField("bio", text)}
            multiline
            maxLength={500}
            placeholderTextColor={MUTED}
            returnKeyType="default"
          />
          <Text style={styles.characterCount}>
            {(profileData?.bio ?? "").length}/500
          </Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 24,
    textAlign: "center",
  },
  fieldContainer: { marginBottom: 24, alignItems: "center" },
  labelWithCheckmark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    textAlign: "center",
  },
  checkmarkBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: PRIMARY,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "600",
  },
  uploadSuccess: {
    marginTop: 6,
    color: SUCCESS,
    fontWeight: "600",
  },
  bioInput: {
    width: "100%",
    minHeight: 120,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    textAlignVertical: "top",
  },
  bioInputCompleted: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },
  characterCount: {
    textAlign: "right",
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
  },
  interestInputContainer: {
    flexDirection: "row",
    width: "100%",
  },
  interestInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginRight: 8,
    fontSize: 16,
    color: DARK,
  },
  addButton: {
    paddingHorizontal: 16,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "600" },
  interestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  interestText: {
    marginRight: 6,
    color: DARK,
    fontSize: 14,
  },
});