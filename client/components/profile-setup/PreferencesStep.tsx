import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { ProfileSetupData } from "../../app/profile-setup/[step]";
import { useCallback, useState } from "react";
import { DARK, MUTED, PRIMARY, BACKGROUND } from "../../constants/theme";

interface PreferencesStepProps {
  data: ProfileSetupData;
  onUpdate: (data: Partial<ProfileSetupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PreferencesStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: PreferencesStepProps) {
  const canContinue = true;
  const toggleIntent = useCallback(
    (intent: string) => {
      const currentIntents = data.intent || [];
      let newIntents;

      if (currentIntents.includes(intent)) {
        newIntents = currentIntents.filter((i) => i !== intent);
      } else {
        newIntents = [...currentIntents, intent];
      }

      onUpdate({ intent: newIntents });
    },
    [data.intent, onUpdate]
  );

  const isIntentSelected = useCallback(
    (intent: string) => {
      const currentIntents = data.intent || [];
      return currentIntents.includes(intent);
    },
    [data.intent]
  );

  const handleSliderChange = useCallback(
    (low: number, high: number) => {
      if (data.minAge !== low || data.maxAge !== high) {
        onUpdate({
          minAge: low,
          maxAge: high,
        });
      }
    },
    [data.minAge, data.maxAge, onUpdate]
  );

  const handleFirstPronounChange = useCallback(
    (text: string) => {
      const secondPart = data.pronouns?.split("/")[1] || "";
      onUpdate({ pronouns: `${text}/${secondPart}` });
    },
    [data.pronouns, onUpdate]
  );

  const handleSecondPronounChange = useCallback(
    (text: string) => {
      const firstPart = data.pronouns?.split("/")[0] || "";
      onUpdate({ pronouns: `${firstPart}/${text}` });
    },
    [data.pronouns, onUpdate]
  );

  const renderThumb = useCallback(() => <View style={styles.thumb} />, []);
  const renderRail = useCallback(
    () => <View style={styles.railBackground} />,
    []
  );
  const renderRailSelected = useCallback(
    () => <View style={styles.railSelected} />,
    []
  );

  const [orientationOpen, setOrientationOpen] = useState(false);
  const [orientationValue, setOrientationValue] = useState(
    data.sexualOrientation
  );
  const [orientationItems, setOrientationItems] = useState([
    { label: "Straight", value: "Straight" },
    { label: "Gay", value: "Gay" },
    { label: "Lesbian", value: "Lesbian" },
    { label: "Bisexual", value: "Bisexual" },
    { label: "Questioning", value: "Questioning" },
    { label: "Other", value: "Other" },
  ]);

  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState(data.genderPreference);
  const [genderItems, setGenderItems] = useState([
    { label: "Men", value: "Men" },
    { label: "Women", value: "Women" },
    { label: "Non-binary", value: "Non-binary" },
    { label: "All", value: "All" },
    { label: "Other", value: "Other" },
  ]);

  const handleOrientationChange = (value: string | null) => {
    if (value) {
      setOrientationValue(value as ProfileSetupData["sexualOrientation"]);
      onUpdate({
        sexualOrientation: value as ProfileSetupData["sexualOrientation"],
      });
    }
  };
  const handleGenderChange = (value: string | null) => {
    if (value) {
      setGenderValue(value as ProfileSetupData["genderPreference"]);
      onUpdate({
        genderPreference: value as ProfileSetupData["genderPreference"],
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
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
              value={data.pronouns?.split("/")[0] || ""}
              onChangeText={handleFirstPronounChange}
              maxLength={10}
              placeholderTextColor={MUTED}
            />
            <Text style={styles.pronounSlash}>/</Text>
            <TextInput
              style={styles.pronounInput}
              placeholder="them"
              value={data.pronouns?.split("/")[1] || ""}
              onChangeText={handleSecondPronounChange}
              maxLength={10}
              placeholderTextColor={MUTED}
            />
          </View>
        </View>

        {/* Intent */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Looking for</Text>
          <View style={styles.intentContainer}>
            {["True Love", "Club Partner", "Study Buddy", "Not Sure"].map(
              (intent) => (
                <TouchableOpacity
                  key={intent}
                  onPress={() => toggleIntent(intent)}
                  style={[
                    styles.intentBox,
                    isIntentSelected(intent) && styles.intentBoxSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.intentText,
                      isIntentSelected(intent) && styles.intentTextSelected,
                    ]}
                  >
                    {intent}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Sexual Orientation Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Sexual Orientation</Text>
          <DropDownPicker
            placeholder="Enter your sexual orientation"
            open={orientationOpen}
            value={orientationValue}
            items={orientationItems}
            setOpen={setOrientationOpen}
            setValue={setOrientationValue}
            setItems={setOrientationItems}
            listMode="SCROLLVIEW"
            onChangeValue={handleOrientationChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            placeholderStyle={styles.placeholderStyle}
          />
        </View>

        {/* Gender Preference Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Preferred Gender</Text>
          <DropDownPicker
            placeholder="Enter your preferred gender"
            open={genderOpen}
            value={genderValue}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={setGenderValue}
            setItems={setGenderItems}
            listMode="SCROLLVIEW"
            onChangeValue={handleGenderChange}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={1000}
            placeholderStyle={styles.placeholderStyle}
          />
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
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdown: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 8,
    marginBottom: 8,
    zIndex: 2000,
  },
  dropdownContainer: {
    backgroundColor: BACKGROUND,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    zIndex: 2000,
  },
  pronounContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pronounInput: {
    minWidth: 80,
    maxWidth: 240,
    padding: 12,
    backgroundColor: BACKGROUND,
    borderRadius: 8,
    fontSize: 16,
    color: DARK,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    textAlign: "center",
  },
  pronounSlash: {
    fontSize: 18,
    color: MUTED,
    marginHorizontal: 12,
    fontWeight: "bold",
  },
  intentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  intentBox: {
    flex: 1,
    minWidth: "22%",
    height: 48,
    paddingHorizontal: 8,
    backgroundColor: BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  intentBoxSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  intentText: {
    fontSize: 12,
    color: DARK,
    textAlign: "center",
    fontWeight: "500",
    justifyContent: "center",
  },
  intentTextSelected: {
    color: "white",
    fontWeight: "600",
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
  placeholderStyle: {
    color: MUTED,
    fontWeight: "400",
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: MUTED,
  },
  ageRangeContainer: {
    gap: 16,
  },
  ageSliderContainer: {
    marginBottom: 16,
  },
  ageLabel: {
    fontSize: 14,
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  ageRangeDisplay: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
    textAlign: "center",
  },
  singleSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "500",
    minWidth: 24,
    textAlign: "center",
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderDescription: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  rangeSliderContainer: {
    paddingHorizontal: 8,
  },
  sliderBox: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSlider: {
    width: "100%",
    height: 20,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000000",
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
    backgroundColor: "#e5e7eb",
  },
  railBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  railSelected: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
});
