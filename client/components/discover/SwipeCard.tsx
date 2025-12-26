// React core
import { useMemo, useState } from "react";

// React Native
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Third-party
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { DANGER, SUCCESS } from "@/constants/theme";
import { Profile } from "@/types/Profile";
import ActionMenu from "@/components/shared/ActionMenu";
import AlertModal from "@/components/shared/AlertModal";
import { blockUser } from "@/services/blocksService";
import logger from "@/config/logger";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;
const SWIPE_THRESHOLD = width * 0.3;

interface GradientIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  colors: readonly [string, string, ...string[]];
}

const GradientIcon = ({ name, size, colors }: GradientIconProps) => (
  <MaskedView
    maskElement={<Ionicons name={name} size={size} />}
    style={{ width: size, height: size }}
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  </MaskedView>
);

// Types
interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  active?: boolean;
}

/**
 * Swipeable card component for discover flow
 * Supports left/right swipe gestures with spring animations and action overlays
 */
export default function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  active = true,
}: SwipeCardProps) {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(active)
        .onStart(() => {
          context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
          translateX.value = event.translationX + context.value.x;
          translateY.value = event.translationY + context.value.y;
        })
        .onEnd((event) => {
          if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
            const direction = event.translationX > 0 ? "right" : "left";
            translateX.value = withSpring(
              direction === "right" ? width * 1.5 : -width * 1.5,
              {},
              () => {
                if (direction === "right") {
                  runOnJS(onSwipeRight)();
                } else {
                  runOnJS(onSwipeLeft)();
                }
              }
            );
          } else {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
          }
        }),
    [active, onSwipeLeft, onSwipeRight, context, translateX, translateY]
  );

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, width / 4],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-width / 4, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const handleBlockUser = async () => {
    setShowBlockConfirm(false);
    const result = await blockUser(profile.user_id);
    if (result.success) {
      logger.info("User blocked from discover", { userId: profile.user_id });
      onSwipeLeft();
    } else {
      logger.error("Failed to block user", { error: result.error });
    }
  };

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <ImageBackground
            source={{ uri: profile.avatar_url }}
            style={styles.image}
            imageStyle={{ borderRadius: 20 }}
          >
            <ActionMenu
              options={[
                {
                  label: "Block User",
                  icon: "ban",
                  onPress: () => setShowBlockConfirm(true),
                  destructive: true,
                },
              ]}
              style={styles.actionMenu}
              iconColor="white"
              iconSize={20}
            />

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.gradient}
            >
              <View style={styles.infoContainer}>
                <Text style={styles.name}>
                  {profile.name}, {new Date().getFullYear() - new Date(profile.birthdate).getFullYear()}
                </Text>
                <Text style={styles.bio} numberOfLines={2}>
                  {profile.bio}
                </Text>
              </View>
            </LinearGradient>

            {/* Like Overlay */}
            <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
              <GradientIcon
                name="heart"
                size={100}
                colors={[SUCCESS, "#22c55e"] as const}
              />
            </Animated.View>

            {/* Nope Overlay */}
            <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
              <GradientIcon
                name="close"
                size={100}
                colors={[DANGER, "#dc2626"] as const}
              />
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      </GestureDetector>

      <AlertModal
        visible={showBlockConfirm}
        title="Block User"
        message="You won't see each other anymore. This can't be undone from here."
        type="warning"
        onConfirm={handleBlockUser}
        onClose={() => setShowBlockConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "absolute",
  },
  actionMenu: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    justifyContent: "flex-end",
    padding: 20,
    borderRadius: 20,
  },
  infoContainer: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  overlay: {
    position: "absolute",
    top: 40,
    // Removed box styles
    transform: [{ rotate: "-15deg" }],
  },
  likeOverlay: {
    left: 40,
    transform: [{ rotate: "-15deg" }],
  },
  nopeOverlay: {
    right: 40,
    transform: [{ rotate: "15deg" }],
  },
});
