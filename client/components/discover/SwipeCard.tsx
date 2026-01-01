// React core
import { useMemo, useState } from "react";

// React Native
import {
  Dimensions,
  Pressable,
  StyleSheet,
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
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Project imports
import { DANGER, SUCCESS } from "@/constants/theme";
import { Profile } from "@/types/Profile";
import ActionMenu from "@/components/shared/ActionMenu";
import AlertModal from "@/components/shared/AlertModal";
import PhotoGalleryCard from "@/components/discover/PhotoGalleryCard";
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
  onViewProfile?: () => void;
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
  onViewProfile,
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
    try {
      const result = await blockUser(profile.user_id);
      if (result.success) {
        logger.info("User blocked from discover", { userId: profile.user_id });
        onSwipeLeft();
      } else {
        logger.error("Failed to block user", { error: result.error });
      }
    } catch (err) {
      logger.error("Unexpected error blocking user", {
        userId: profile.user_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const calculateAge = (birthdate: string): number => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  const age = calculateAge(profile.birthdate);
  const photos = profile.photos || [profile.avatar_url];

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <PhotoGalleryCard
            photos={photos}
            avatarUrl={profile.avatar_url}
            isActive={active}
            userName={profile.name}
            age={age}
            bio={profile.bio}
          />

          {/* Action Menu */}
          <ActionMenu
            options={[
              {
                label: "View Profile",
                icon: "person-outline",
                onPress: onViewProfile || (() => {}),
              },
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

          {/* Like/Nope Overlays */}
          <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
            <GradientIcon
              name="heart"
              size={100}
              colors={[SUCCESS, "#22c55e"] as const}
            />
          </Animated.View>

          <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
            <GradientIcon
              name="close"
              size={100}
              colors={[DANGER, "#dc2626"] as const}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Block confirmation */}
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
  cardWrapper: {
    position: "absolute",
  },
  actionMenu: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  overlay: {
    position: "absolute",
    top: 40,
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
