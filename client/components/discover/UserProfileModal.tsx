import { useCallback, useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileView from "@/components/profile/ProfileView";

interface UserProfileModalProps {
  visible: boolean;
  userId: string;
  onDismiss: () => void;
}

export default function UserProfileModal({
  visible,
  userId,
  onDismiss,
}: UserProfileModalProps) {
  const translateY = useSharedValue(1000);

  // Animate in when visible
  if (visible) {
    translateY.value = withSpring(0);
  }

  // Pan gesture for swipe-down dismiss
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([10, 10])
        .onUpdate((e) => {
          if (e.translationY > 0) {
            translateY.value = e.translationY;
          }
        })
        .onEnd((e) => {
          if (e.velocityY > 500 || e.translationY > 100) {
            translateY.value = withSpring(1000, {}, () => {
              runOnJS(onDismiss)();
            });
          } else {
            translateY.value = withSpring(0);
          }
        }),
    [onDismiss, translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = useCallback(() => {
    translateY.value = withSpring(1000, {}, () => {
      runOnJS(onDismiss)();
    });
  }, [onDismiss, translateY]);

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      {/* Backdrop */}
      <Pressable
        onPress={handleClose}
        style={styles.backdrop}
        accessible={false}
      />

      {/* Modal Content */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            {/* Handle bar and close button */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {/* Profile content */}
            <ProfileView userId={userId} isEditable={false} />
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "90%",
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
