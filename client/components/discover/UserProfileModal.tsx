import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = useCallback(() => {
    runOnJS(onDismiss)();
  }, [onDismiss]);

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      {/* Backdrop */}
      <Pressable
        onPress={handleClose}
        style={styles.backdrop}
        accessible={false}
      />

      {/* Modal Content */}
      <Animated.View style={[styles.modalContainer, animatedStyle]}>
        {/* Close button - top right */}
        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close profile"
        >
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>

        {/* Profile content - scrollable */}
        <View style={styles.content}>
          <ProfileView
            userId={userId}
            isEditable={false}
            shouldFetch={visible}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "90%",
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    flexDirection: "column",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  content: {
    flex: 1,
  },
});
