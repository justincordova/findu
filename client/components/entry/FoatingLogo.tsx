// React core
import { useEffect, useRef } from "react";

// React Native
import { Animated, Easing, StyleSheet, View } from "react-native";

// Constants
const FLOAT_UP_VALUE = -10;
const ANIMATION_DURATION = 1500;
const LOGO_SIZE = 120;

/**
 * Floating animated logo that bounces up and down continuously
 * Used on entry screen for visual appeal
 */
export default function FloatingLogo() {
  const translateY = useRef(new Animated.Value(0)).current;

  // Loop floating animation infinitely
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: FLOAT_UP_VALUE,
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateY]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("@/assets/images/logo.png")}
        style={[styles.logo, { transform: [{ translateY }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
