import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { MUTED } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * Skeleton loader component for displaying loading placeholders
 * Shows a shimmer effect while content is loading
 */
export default function SkeletonLoader({
  width = "100%",
  height = 12,
  borderRadius = 4,
  style,
  animated = true,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim, animated]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animated ? opacity : 0.5,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton group for displaying multiple skeleton loaders
 * Useful for cards, lists, and profile sections
 */
export function SkeletonGroup({
  count = 1,
  spacing = 8,
  style,
}: {
  count?: number;
  spacing?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ gap: spacing }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader key={i} />
      ))}
    </View>
  );
}

/**
 * Skeleton card for displaying loading profile cards
 * Shows avatar, name, and description placeholders
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      {/* Avatar */}
      <SkeletonLoader
        width={60}
        height={60}
        borderRadius={30}
        style={styles.avatar}
      />

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Name */}
        <SkeletonLoader
          width="60%"
          height={16}
          borderRadius={4}
          style={styles.name}
        />

        {/* Description */}
        <SkeletonLoader
          width="80%"
          height={12}
          borderRadius={4}
          style={styles.description}
        />

        {/* Metadata */}
        <SkeletonLoader
          width="40%"
          height={10}
          borderRadius={4}
          style={styles.metadata}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: MUTED,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  name: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 2,
  },
  metadata: {
    marginTop: 4,
  },
});
