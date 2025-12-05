import React, { useState, useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { profileApi } from "@/api/profile";
import AlertModal from "@/components/shared/AlertModal";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";
import { DARK, MUTED, PRIMARY } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar, uploadPhotos } from "@/services/uploadService";
import AgeRangeSlider from "@/components/shared/AgeRangeSlider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.3;

const YEAR_MAP: Record<number, string> = {
  1: "Freshman",
  2: "Sophomore",
  3: "Junior",
  4: "Senior",
  5: "Grad",
};

export default function ProfileScreen() {
  const { data: profileData, setProfileData } = useProfileSetupStore();
  const [loading, setLoading] = useState(!profileData);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [editingInterests, setEditingInterests] = useState<string[]>([]);
  const [editingAcademic, setEditingAcademic] = useState<any>({});
  const [editingBasic, setEditingBasic] = useState<any>({});
  const [editingIntent, setEditingIntent] = useState<string>("");
  const [editingGenderPreference, setEditingGenderPreference] = useState<string[]>([]);
  const [editingAgeRange, setEditingAgeRange] = useState<{ min_age: number; max_age: number }>({ min_age: 18, max_age: 99 });
  
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<{label: string, value: any}[]>([]);
  const [dropdownTitle, setDropdownTitle] = useState("");
  const dropdownOnSelectRef = useRef<(value: any) => void>(() => {});
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'error' | 'warning' | 'success'; onConfirm?: () => void }>({ 
    visible: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const handleSliderChange = useCallback(
    (low: number, high: number) => {
      setEditingAgeRange({ min_age: low, max_age: high });
    },
    []
  );

  const fetchProfile = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const data = await profileApi.me();
      setProfileData(data);
    } catch (err) {
      logger.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [loading, setProfileData]);

  useFocusEffect(
    useCallback(() => {
      if (!profileData) {
        fetchProfile();
      } else {
        logger.info("Profile data already in store. Skipping fetch.");
      }
    }, [profileData, fetchProfile])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = Array.isArray(profileData?.photos) ? profileData.photos : [];
  const displayPhotos = photos.length > 0 ? photos : [];
  
  const calculateAge = (birthdate: string | undefined): number | null => {
    if (!birthdate) return null;
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(profileData?.birthdate);
  const interests = Array.isArray(profileData?.interests)
    ? profileData.interests.filter(Boolean).map(String)
    : [];

  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  const openEditModal = (field: string, currentValue: any) => {
    setEditingField(field);
    if (field === "interests") {
      setEditingInterests(Array.isArray(currentValue) ? currentValue : []);
    } else if (field === "intent") {
      setEditingIntent(typeof currentValue === 'string' ? currentValue : "");
    } else if (field === "academic") {
      setEditingAcademic(currentValue || {});
    } else if (field === "basic") {
      setEditingBasic(currentValue || {});
      const genderPref = profileData?.gender_preference;
      setEditingGenderPreference(Array.isArray(genderPref) ? genderPref : []);
      const intent = profileData?.intent;
      setEditingIntent(typeof intent === 'string' ? intent : "");
      setEditingAgeRange({
        min_age: Number(profileData?.min_age ?? 18),
        max_age: Number(profileData?.max_age ?? 26)
      });
      setEditingBasic({
        ...currentValue,
        sexual_orientation: profileData?.sexual_orientation || ""
      });
    } else {
      setEditValue(currentValue?.toString() || "");
    }
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      let updateData: any = {};
      
      if (editingField === "interests") {
        updateData.interests = editingInterests;
      } else if (editingField === "intent") {
        updateData.intent = editingIntent;
      } else if (editingField === "academic") {
        updateData = { ...editingAcademic };
      } else if (editingField === "basic") {
        updateData = { 
          ...editingBasic, 
          gender_preference: editingGenderPreference, 
          intent: editingIntent,
          min_age: editingAgeRange.min_age,
          max_age: editingAgeRange.max_age
        };
      } else {
        updateData[editingField] = editValue;
      }

      const userId = profileData?.user_id;
      if (!userId) {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'User ID not found',
          type: 'error'
        });
        return;
      }

      await profileApi.update(userId, updateData);
      setProfileData({ ...profileData, ...updateData });
      setModalVisible(false);
      setAlertModal({
        visible: true,
        title: 'Success',
        message: 'Profile updated successfully',
        type: 'success'
      });
    } catch (err) {
      logger.error("Error updating profile:", err);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Failed to update profile',
        type: 'error'
      });
    }
  };

  const addInterest = () => {
    const newInterest = editValue.trim();
    if (newInterest && !editingInterests.includes(newInterest)) {
      setEditingInterests([...editingInterests, newInterest]);
      setEditValue("");
    }
  };

  const removeInterest = (interest: string) => {
    setEditingInterests(editingInterests.filter(i => i !== interest));
  };

  const addGenderPreference = (pref: string) => {
    if (pref && !editingGenderPreference.includes(pref)) {
      setEditingGenderPreference([...editingGenderPreference, pref]);
    }
  };

  const removeGenderPreference = (pref: string) => {
    setEditingGenderPreference(editingGenderPreference.filter(p => p !== pref));
  };

  const openDropdown = (title: string, options: {label: string, value: any}[], onSelect: (value: any) => void) => {
    console.log('Opening dropdown:', title, 'Options:', options);
    console.log('modalVisible:', modalVisible);
    console.log('dropdownModalVisible before:', dropdownModalVisible);
    setDropdownTitle(title);
    setDropdownOptions(options);
    dropdownOnSelectRef.current = onSelect;
    setDropdownModalVisible(true);
    console.log('Dropdown modal should be visible now');
    
    setTimeout(() => {
      console.log('dropdownModalVisible after timeout:', dropdownModalVisible);
    }, 100);
  };

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setAlertModal({
        visible: true,
        title: 'Permission Required',
        message: 'Please allow access to your photos',
        type: 'warning'
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploadingAvatar(true);
        const imageUri = result.assets[0].uri;
        const newAvatarUrl = await uploadAvatar(profileData?.user_id || "", imageUri, "update");
        
        setProfileData({ ...profileData, avatar_url: newAvatarUrl });
        
        setAlertModal({
          visible: true,
          title: 'Success',
          message: 'Profile picture updated',
          type: 'success'
        });
      } catch (err) {
        logger.error("Error uploading avatar:", err);
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'Failed to upload image',
          type: 'error'
        });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const pickPhotos = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setAlertModal({
        visible: true,
        title: 'Permission Required',
        message: 'Please allow access to your photos',
        type: 'warning'
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const currentPhotoCount = Array.isArray(profileData?.photos) ? profileData.photos.length : 0;
      const newPhotosCount = result.assets.length;
      const totalCount = currentPhotoCount + newPhotosCount;
      
      if (totalCount > 6) {
        const allowedCount = 6 - currentPhotoCount;
        setAlertModal({
          visible: true,
          title: 'Photo Limit',
          message: allowedCount > 0 
            ? `You can only add ${allowedCount} more photo${allowedCount === 1 ? '' : 's'}. You have ${currentPhotoCount} photo${currentPhotoCount === 1 ? '' : 's'} and are trying to add ${newPhotosCount}.`
            : 'You already have 6 photos. Please remove some photos before adding new ones.',
          type: 'warning'
        });
        return;
      }

      try {
        setUploadingPhotos(true);
        const photoUris = result.assets.map(asset => asset.uri);
        const newPhotoUrls = await uploadPhotos(profileData?.user_id || "", photoUris, "update");
        
        const currentPhotos = Array.isArray(profileData?.photos) ? profileData.photos : [];
        const updatedPhotos = [...currentPhotos, ...newPhotoUrls];
        setProfileData({ ...profileData, photos: updatedPhotos });
      } catch (err) {
        logger.error("Error uploading photos:", err);
        setUploadingPhotos(false);
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'Failed to upload photos',
          type: 'error'
        });
        return;
      }
      
      setUploadingPhotos(false);
      logger.info('Setting alert modal:', {
        visible: true,
        title: 'Success',
        message: `Photo${newPhotosCount === 1 ? '' : 's'} added successfully`,
        type: 'success'
      });
      setAlertModal({
        visible: true,
        title: 'Success',
        message: `Photo${newPhotosCount === 1 ? '' : 's'} added successfully`,
        type: 'success'
      });
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      const currentPhotos = Array.isArray(profileData?.photos) ? profileData.photos : [];
      const newPhotos = currentPhotos.filter(p => p !== photoUrl);
      
      await profileApi.update(profileData?.user_id || "", { photos: newPhotos });
      setProfileData({ ...profileData, photos: newPhotos });
      setAlertModal({
        visible: true,
        title: 'Success',
        message: 'Photo removed successfully',
        type: 'success'
      });
    } catch (err) {
      logger.error("Error removing photo:", err);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: 'Failed to remove photo',
        type: 'error'
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Photo Carousel */}
        <View style={styles.photoCarouselContainer}>
          {displayPhotos.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
              >
                {displayPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              
              {/* Persistent Action Buttons */}
              {displayPhotos.length > 0 && (
                <>
                  {/* Delete current photo button - bottom left */}
                  {displayPhotos.length > 2 && (
                    <TouchableOpacity 
                      style={styles.deletePhotoButton}
                      onPress={() => {
                        const currentPhoto = displayPhotos[currentPhotoIndex];
                        setAlertModal({
                          visible: true,
                          title: 'Delete Photo',
                          message: 'Are you sure you want to delete this photo?',
                          type: 'warning',
                          onConfirm: () => removePhoto(currentPhoto)
                        });
                      }}
                    >
                      <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  {/* Add photo button - bottom right */}
                  {displayPhotos.length < 6 && (
                    <TouchableOpacity 
                      style={styles.addPhotoButton}
                      onPress={pickPhotos}
                      disabled={uploadingPhotos}
                    >
                      {uploadingPhotos ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="add" size={24} color="white" />
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {/* Photo Indicators */}
              {displayPhotos.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {displayPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentPhotoIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noPhotoContainer}>
              <Ionicons name="person-circle-outline" size={120} color="#D1D5DB" />
              <Text style={styles.noPhotoText}>No photos</Text>
            </View>
          )}
          
          {/* Add photo button for no photos state */}
          {displayPhotos.length === 0 && (
            <TouchableOpacity 
              style={styles.addPhotoButton}
              onPress={pickPhotos}
              disabled={uploadingPhotos}
            >
              {uploadingPhotos ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="add" size={24} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Profile Card */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => openEditModal("name", profileData?.name)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.profileCardContent}>
              <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
                {profileData?.avatar_url ? (
                  <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {profileData?.name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
                {uploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="small" color={PRIMARY} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.nameInfo}>
                <Text style={styles.nameText}>
                  {profileData?.name}
                  {age !== null && (
                    <Text style={styles.ageText}>, {age}</Text>
                  )}
                </Text>
                {profileData?.university_name && (
                  <View style={styles.universityRow}>
                    <Ionicons name="school" size={16} color="#666" />
                    <Text style={styles.universityText}>
                      {profileData.university_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Bio Card */}
          {profileData?.bio && (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => openEditModal("bio", profileData.bio)}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="reader-outline" size={24} color={PRIMARY} />
                <Text style={styles.cardTitle}>About Me</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.bioText}>{profileData.bio}</Text>
            </TouchableOpacity>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => openEditModal("interests", interests)}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="heart-outline" size={24} color={PRIMARY} />
                <Text style={styles.cardTitle}>Interests</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              <View style={styles.interestsContainer}>
                {interests.map((interest, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}

          {/* Academic Info */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => openEditModal("academic", {
              major: profileData?.major,
              university_year: profileData?.university_year,
              grad_year: profileData?.grad_year
            })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Academic Info</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.infoGrid}>
              {profileData?.major && (
                <View style={styles.infoItem}>
                  <Ionicons name="book-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Major</Text>
                    <Text style={styles.infoValue}>{profileData.major}</Text>
                  </View>
                </View>
              )}
              {profileData?.university_year && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Year</Text>
                    <Text style={styles.infoValue}>
                      {YEAR_MAP[profileData.university_year] || "N/A"}
                    </Text>
                  </View>
                </View>
              )}
              {profileData?.grad_year && (
                <View style={styles.infoItem}>
                  <Ionicons name="flag-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Graduating</Text>
                    <Text style={styles.infoValue}>{profileData.grad_year}</Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Basic Info */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => openEditModal("basic", {
              gender: profileData?.gender,
              pronouns: profileData?.pronouns
            })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Basic Info</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.infoGrid}>
              {profileData?.gender && (
                <View style={styles.infoItem}>
                  <Ionicons name="male-female-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>{profileData.gender}</Text>
                  </View>
                </View>
              )}
              {profileData?.pronouns && (
                <View style={styles.infoItem}>
                  <Ionicons name="chatbox-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Pronouns</Text>
                    <Text style={styles.infoValue}>{profileData.pronouns}</Text>
                  </View>
                </View>
              )}
              {profileData?.sexual_orientation && (
                <View style={styles.infoItem}>
                  <Ionicons name="heart-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Sexual Orientation</Text>
                    <Text style={styles.infoValue}>{profileData.sexual_orientation}</Text>
                  </View>
                </View>
              )}
              {profileData?.intent && (
                <View style={styles.infoItem}>
                  <Ionicons name="compass-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Looking For</Text>
                    <Text style={styles.infoValue}>
                      {profileData.intent.charAt(0).toUpperCase() + profileData.intent.slice(1)}
                    </Text>
                  </View>
                </View>
              )}
              {(profileData?.min_age || profileData?.max_age) && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Age Range</Text>
                    <Text style={styles.infoValue}>{profileData.min_age || 18} - {profileData.max_age || 99}</Text>
                  </View>
                </View>
              )}
              {profileData?.gender_preference && Array.isArray(profileData.gender_preference) && profileData.gender_preference.length > 0 && (
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={20} color={MUTED} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Interested In</Text>
                    <View style={styles.interestsContainer}>
                      {profileData.gender_preference.map((pref, idx) => (
                        <View key={idx} style={styles.interestBadge}>
                          <Text style={styles.interestText}>{pref}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Dropdown Modal - MOVED BEFORE EDIT MODAL */}
      {dropdownModalVisible && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('Dropdown modal onRequestClose called');
            setDropdownModalVisible(false);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                width: "85%",
                maxHeight: "60%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  {dropdownTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('Close button pressed');
                    setDropdownModalVisible(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView>
                {dropdownOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth:
                        index < dropdownOptions.length - 1 ? 1 : 0,
                      borderBottomColor: "#F3F4F6",
                    }}
                    onPress={() => {
                      console.log("Option selected:", option);
                      dropdownOnSelectRef.current(option.value);
                      setDropdownModalVisible(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#374151",
                        fontWeight: "500",
                      }}
                    >
                      {option.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal
        visible={modalVisible && !dropdownModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {
                  editingField === "name" ? "Name" :
                  editingField === "bio" ? "About Me" : 
                  editingField === "interests" ? "Interests" :
                  editingField === "intent" ? "Looking For" :
                  editingField === "academic" ? "Academic Info" :
                  editingField === "basic" ? "Basic Info" : ""
                }
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
            >
              {editingField === "name" ? (
                <TextInput
                  style={styles.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="Enter your name"
                />
              ) : editingField === "bio" ? (
                <TextInput
                  style={styles.modalTextArea}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              ) : editingField === "interests" ? (
                <View>
                  <View style={styles.addInterestContainer}>
                    <TextInput
                      style={styles.modalInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="Add an interest..."
                      onSubmitEditing={addInterest}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addInterest}>
                      <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.interestsContainer}>
                    {editingInterests.map((interest, index) => (
                      <View key={index} style={styles.editInterestBadge}>
                        <Text style={styles.interestText}>{interest}</Text>
                        <TouchableOpacity onPress={() => removeInterest(interest)}>
                          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : editingField === "intent" ? (
                <View>
                  <Text style={styles.formLabel}>Select what you&apos;re looking for</Text>
                  <View style={styles.intentOptionsContainer}>
                    {["Dating", "Friendship", "Networking", "Casual"].map((option) => {
                      const value = option.toLowerCase();
                      const isSelected = editingIntent === value;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.intentOption,
                            isSelected && styles.intentOptionSelected
                          ]}
                          onPress={() => setEditingIntent(value)}
                        >
                          <Text style={[
                            styles.intentOptionText,
                            isSelected && styles.intentOptionTextSelected
                          ]}>
                            {option}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : editingField === "academic" ? (
                <View style={styles.formContainer}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Major</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editingAcademic.major || ""}
                      onChangeText={(text) => setEditingAcademic({...editingAcademic, major: text})}
                      placeholder="Enter your major"
                    />
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Year</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          openDropdown(
                            "Select Year",
                            [
                              { label: "Freshman", value: 1 },
                              { label: "Sophomore", value: 2 },
                              { label: "Junior", value: 3 },
                              { label: "Senior", value: 4 },
                              { label: "Graduate", value: 5 },
                            ],
                            (value) => setEditingAcademic({...editingAcademic, university_year: value})
                          );
                        }}
                      >
                        <Text style={styles.dropdownText}>
                          {editingAcademic.university_year 
                            ? ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"][editingAcademic.university_year - 1]
                            : "Select year"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Graduation Year</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editingAcademic.grad_year?.toString() || ""}
                      onChangeText={(text) => setEditingAcademic({...editingAcademic, grad_year: parseInt(text) || undefined})}
                      placeholder="2025"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : editingField === "basic" ? (
                <View style={styles.formContainer}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Gender</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          openDropdown(
                            "Select Gender",
                            [
                              { label: "Male", value: "Male" },
                              { label: "Female", value: "Female" },
                              { label: "Non-binary", value: "Non-binary" },
                              { label: "Other", value: "Other" },
                            ],
                            (value) => setEditingBasic({...editingBasic, gender: value})
                          );
                        }}
                      >
                        <Text style={styles.dropdownText}>
                          {editingBasic.gender || "Select gender"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Pronouns</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => {
                          openDropdown(
                            "Select Pronouns",
                            [
                              { label: "they/them", value: "they/them" },
                              { label: "he/him", value: "he/him" },
                              { label: "she/her", value: "she/her" },
                              { label: "xe/xem", value: "xe/xem" },
                              { label: "ze/zir", value: "ze/zir" },
                              { label: "other", value: "other" },
                            ],
                            (value) => setEditingBasic({...editingBasic, pronouns: value})
                          );
                        }}
                      >
                        <Text style={styles.dropdownText}>
                          {editingBasic.pronouns || "Select pronouns"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Sexual Orientation</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => {
                        openDropdown(
                          "Select Sexual Orientation",
                          [
                            { label: "Straight", value: "Straight" },
                            { label: "Gay", value: "Gay" },
                            { label: "Lesbian", value: "Lesbian" },
                            { label: "Bisexual", value: "Bisexual" },
                            { label: "Pansexual", value: "Pansexual" },
                            { label: "Asexual", value: "Asexual" },
                            { label: "Queer", value: "Queer" },
                            { label: "Questioning", value: "Questioning" },
                            { label: "Other", value: "Other" },
                          ],
                          (value) => setEditingBasic({...editingBasic, sexual_orientation: value})
                        );
                      }}
                    >
                      <Text style={styles.dropdownText}>
                        {editingBasic.sexual_orientation || "Select sexual orientation"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Looking For</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => {
                        openDropdown(
                          "Select Intent",
                          [
                            { label: "Dating", value: "dating" },
                            { label: "Friendship", value: "friendship" },
                            { label: "Networking", value: "networking" },
                            { label: "Casual", value: "casual" },
                          ],
                          (value) => setEditingIntent(value)
                        );
                      }}
                    >
                      <Text style={styles.dropdownText}>
                        {editingIntent ? editingIntent.charAt(0).toUpperCase() + editingIntent.slice(1) : "Select looking for"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Age Range</Text>
                    <AgeRangeSlider
                      minAge={editingAgeRange.min_age ?? 18}
                      maxAge={editingAgeRange.max_age ?? 26}
                      onAgeRangeChange={handleSliderChange}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Interested In (select all that apply)</Text>
                    <View style={styles.intentOptionsContainer}>
                      {["Men", "Women", "Non-binary", "All"].map((option) => {
                        const isSelected = editingGenderPreference.includes(option);
                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.intentOption,
                              isSelected && styles.intentOptionSelected
                            ]}
                            onPress={() => isSelected ? removeGenderPreference(option) : addGenderPreference(option)}
                          >
                            <Text style={[
                              styles.intentOptionText,
                              isSelected && styles.intentOptionTextSelected
                            ]}>
                              {option}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flex: 1,
  },
  profileCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarPlaceholderText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#9CA3AF",
  },
  nameInfo: {
    flex: 1,
  },
  editButtonFixed: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  photoCarouselContainer: {
    height: PHOTO_HEIGHT,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  noPhotoContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  noPhotoText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    flex: 1,
    maxWidth: 40,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  ageText: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000",
  },
  universityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  universityText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  contentSection: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: DARK,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    color: "#000",
    fontSize: 14,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: MUTED,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: DARK,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },
  addInterestContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  editInterestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    gap: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  formContainer: {
    gap: 20,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  dropdownContainer: {
    width: "100%",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownOptionsContainer: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  addPhotoButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: "relative",
  },
  deletePhotoButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 16,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
  },
  intentOptionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  intentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  intentOptionSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  intentOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  intentOptionTextSelected: {
    color: "white",
  },
});