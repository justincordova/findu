// React core

// Navigation
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
// React Native
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Animations
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Project imports
import { PRIMARY } from "@/constants/theme";

// Layout constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_MARGIN = 16;
const TAB_BAR_HEIGHT = 44;
const TAB_BAR_RADIUS = 22;
const TAB_COUNT = 4;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const TAB_BAR_BOTTOM = 32;
const ANIMATION_DURATION = 250;
const ICON_SIZE = 18;
const LABEL_FONT_SIZE = 11;
const LABEL_MARGIN_TOP = 2;
const PILL_Z_INDEX = 1;
const TAB_Z_INDEX = 2;
const CONTAINER_Z_INDEX = 10;
const INACTIVE_ICON_COLOR = "gray";
const TAB_BAR_BG_COLOR = "#F0F0F0";
const PILL_COLOR = "white";
const ACTIVE_OPACITY = 1;

/**
 * Custom animated tab bar with animated pill indicator
 * Shows active tab with smooth animation and icon support
 */

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const translateX = useSharedValue(state.index * TAB_WIDTH);

  // Animate pill position when active tab changes
  useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, {
      duration: ANIMATION_DURATION,
    });
  }, [state.index, translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBarBg}>
        <Animated.View
          style={[
            styles.pill,
            useAnimatedStyle(() => ({
              transform: [{ translateX: translateX.value }],
            })),
          ]}
        />
        {state.routes.map((route, idx: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === idx;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={ACTIVE_OPACITY}
            >
              <View style={styles.tabContent}>
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      focused: isFocused,
                      color: isFocused ? PRIMARY : INACTIVE_ICON_COLOR,
                      size: ICON_SIZE,
                    })
                  : null}
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? PRIMARY : INACTIVE_ICON_COLOR },
                  ]}
                >
                  {typeof label === "string" ? label : String(label || "")}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    bottom: TAB_BAR_BOTTOM,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    backgroundColor: "transparent",
    zIndex: CONTAINER_Z_INDEX,
  },
  tabBarBg: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: TAB_BAR_BG_COLOR,
    borderRadius: TAB_BAR_RADIUS,
    overflow: "hidden",
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    left: 0,
    top: 0,
    width: TAB_WIDTH,
    height: TAB_BAR_HEIGHT,
    backgroundColor: PILL_COLOR,
    borderRadius: TAB_BAR_RADIUS,
    zIndex: PILL_Z_INDEX,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
    zIndex: TAB_Z_INDEX,
  },
  tabContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
    fontSize: LABEL_FONT_SIZE,
    marginTop: LABEL_MARGIN_TOP,
  },
});
