import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  DARK,
  MUTED,
  BACKGROUND,
  PRIMARY,
  SUCCESS,
} from "../../constants/theme";
import { useProfileSetupStore } from "../../store/profileStore";

export default function Step5({
  onBack,
  onValidityChange,
}: {
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const profileData = useProfileSetupStore((state) => state.data);
  const setProfileField = useProfileSetupStore((state) => state.setProfileField);

  const [interestInput, setInterestInput] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const keyboardHeight = useState(new Animated.Value(0))[0];

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

  /** Add interest */
  const addInterest = useCallback(() => {
    const trimmed = interestInput.trim();
    if (trimmed && !profileData?.interests?.includes(trimmed)) {
      setProfileField("interests", [...(profileData?.interests || []), trimmed]);
      setInterestInput("");
      Keyboard.dismiss();
    }
  }, [interestInput, profileData?.interests, setProfileField]);

  /** Remove interest */
  const removeInterest = useCallback(
    (item: string) => {
      setProfileField(
        "interests",
        (profileData?.interests || []).filter((i) => i !== item)
      );
    },
    [profileData?.interests, setProfileField]
  );

  /** Step validity: require profile picture, bio, and at least one interest */
  const isValid = useMemo(
    () =>
      !!profileData?.avatar_url &&
      !!profileData?.bio?.trim() &&
      (profileData?.interests?.length || 0) > 0,
    [profileData?.avatar_url, profileData?.bio, profileData?.interests]
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  /** Keyboard listeners for ScrollView adjustment */
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Animated.ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
        )}

        <Text style={styles.title}>Profile Details</Text>
        <Text style={styles.subtitle}>
          Add a bio, profile picture, and interests
        </Text>

        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
          {photoUploaded && (
            <Text style={styles.uploadSuccess}>Uploaded ✓</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.bioInput}
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

        {/* Interests */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.interestInputContainer}>
            <TextInput
              style={styles.interestInput}
              placeholder="Type an interest"
              value={interestInput}
              onChangeText={setInterestInput}
              placeholderTextColor={MUTED}
              onSubmitEditing={addInterest}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={addInterest}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={profileData?.interests || []}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            renderItem={({ item }) => (
              <View style={styles.interestTag}>
                <Text style={styles.interestText}>{item}</Text>
                <TouchableOpacity onPress={() => removeInterest(item)}>
                  <Ionicons name="close-circle" size={18} color={DARK} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: BACKGROUND,
  },
  backButton: { marginBottom: 12 },
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
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
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
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    textAlignVertical: "top",
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
