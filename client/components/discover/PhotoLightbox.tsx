import { Image, Modal, Pressable, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useMemo, useEffect } from "react";

const { width, height } = Dimensions.get("window");

interface PhotoLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
  isCircle?: boolean;
}

export default function PhotoLightbox({
  uri,
  visible,
  onClose,
  isCircle = false,
}: PhotoLightboxProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Reset shared values when lightbox opens
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      translateY.value = 0;
    }
  }, [visible, scale, translateY]);

  // Pan gesture for swipe-down dismiss
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([10, 10])
        .onUpdate((e) => {
          if (e.translationY > 0) {
            translateY.value = e.translationY;
            scale.value = 1 - e.translationY / (height / 2) * 0.2;
          }
        })
        .onEnd((e) => {
          if (e.velocityY > 500 || e.translationY > 100) {
            // Dismiss
            scale.value = withSpring(0.8);
            translateY.value = withSpring(height, {}, () => {
              runOnJS(onClose)();
            });
          } else {
            // Snap back
            scale.value = withSpring(1);
            translateY.value = withSpring(0);
          }
        }),
    [onClose, scale, translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const backdropOpacity = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / (height / 2) * 0.3,
  }));

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      {/* Dark Backdrop - Tap to close */}
      <Animated.View style={[styles.backdrop, backdropOpacity]}>
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessible={false}
        />
      </Animated.View>

      {/* Centered Image with Gesture */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.imageWrapper,
              isCircle && styles.circleWrapper,
            ]}
            accessible={false}
          >
            <Image
              source={{ uri }}
              style={[
                styles.image,
                isCircle && styles.circleImage,
              ]}
              resizeMode="cover"
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Close Button */}
      <Pressable
        onPress={onClose}
        style={styles.closeButton}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close lightbox"
      >
        <Ionicons name="close" size={28} color="white" />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  imageWrapper: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  circleWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    overflow: "hidden",
  },
  circleImage: {
    borderRadius: width * 0.3,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
