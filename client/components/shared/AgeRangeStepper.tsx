// React core
import React, { useCallback } from "react";

// React Native
import { StyleSheet, Text, View, Pressable } from "react-native";

// Third-party
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { MUTED, PRIMARY } from "@/constants/theme";

// Types
interface AgeRangeStepperProps {
  minAge: number;
  maxAge: number;
  onAgeRangeChange: (min: number, max: number) => void;
  minLimit?: number;
  maxLimit?: number;
}

/**
 * Age Range Stepper Component
 * Allows users to select minimum and maximum age using increment/decrement buttons
 * Works reliably in modals (unlike range sliders)
 */
export default function AgeRangeStepper({
  minAge,
  maxAge,
  onAgeRangeChange,
  minLimit = 18,
  maxLimit = 26,
}: AgeRangeStepperProps) {
  // Handle minimum age decrease
  const handleMinDecrease = useCallback(() => {
    if (minAge > minLimit) {
      onAgeRangeChange(minAge - 1, maxAge);
    }
  }, [minAge, maxAge, minLimit, onAgeRangeChange]);

  // Handle minimum age increase
  const handleMinIncrease = useCallback(() => {
    if (minAge < maxAge - 1) {
      onAgeRangeChange(minAge + 1, maxAge);
    }
  }, [minAge, maxAge, onAgeRangeChange]);

  // Handle maximum age decrease
  const handleMaxDecrease = useCallback(() => {
    if (maxAge > minAge + 1) {
      onAgeRangeChange(minAge, maxAge - 1);
    }
  }, [minAge, maxAge, onAgeRangeChange]);

  // Handle maximum age increase
  const handleMaxIncrease = useCallback(() => {
    if (maxAge < maxLimit) {
      onAgeRangeChange(minAge, maxAge + 1);
    }
  }, [minAge, maxAge, maxLimit, onAgeRangeChange]);

  const isMinDecreaseDisabled = minAge <= minLimit;
  const isMinIncreaseDisabled = minAge >= maxAge - 1;
  const isMaxDecreaseDisabled = maxAge <= minAge + 1;
  const isMaxIncreaseDisabled = maxAge >= maxLimit;

  return (
    <View style={styles.container}>
      {/* Stepper Row */}
      <View style={styles.stepperRow}>
        {/* Minimum Stepper Card */}
        <View style={styles.stepperCard}>
          <Text style={styles.label}>Minimum</Text>
          <Text style={styles.ageDisplay}>{minAge}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isMinDecreaseDisabled && styles.buttonDisabled,
                pressed && !isMinDecreaseDisabled && styles.buttonPressed,
              ]}
              onPress={handleMinDecrease}
              disabled={isMinDecreaseDisabled}
            >
              <Ionicons
                name="remove"
                size={24}
                color={isMinDecreaseDisabled ? MUTED : PRIMARY}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isMinIncreaseDisabled && styles.buttonDisabled,
                pressed && !isMinIncreaseDisabled && styles.buttonPressed,
              ]}
              onPress={handleMinIncrease}
              disabled={isMinIncreaseDisabled}
            >
              <Ionicons
                name="add"
                size={24}
                color={isMinIncreaseDisabled ? MUTED : PRIMARY}
              />
            </Pressable>
          </View>
        </View>

        {/* Maximum Stepper Card */}
        <View style={styles.stepperCard}>
          <Text style={styles.label}>Maximum</Text>
          <Text style={styles.ageDisplay}>{maxAge}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isMaxDecreaseDisabled && styles.buttonDisabled,
                pressed && !isMaxDecreaseDisabled && styles.buttonPressed,
              ]}
              onPress={handleMaxDecrease}
              disabled={isMaxDecreaseDisabled}
            >
              <Ionicons
                name="remove"
                size={24}
                color={isMaxDecreaseDisabled ? MUTED : PRIMARY}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isMaxIncreaseDisabled && styles.buttonDisabled,
                pressed && !isMaxIncreaseDisabled && styles.buttonPressed,
              ]}
              onPress={handleMaxIncrease}
              disabled={isMaxIncreaseDisabled}
            >
              <Ionicons
                name="add"
                size={24}
                color={isMaxIncreaseDisabled ? MUTED : PRIMARY}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        Showing profiles {minAge}-{maxAge} years old
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stepperRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepperCard: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ageDisplay: {
    fontSize: 32,
    fontWeight: "700",
    color: PRIMARY,
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: "#F5F3FF",
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  helperText: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    marginTop: 4,
  },
});
