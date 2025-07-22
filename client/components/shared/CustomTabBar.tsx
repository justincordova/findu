import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { PRIMARY } from "../../constants/theme";

const { width } = Dimensions.get("window");
const TAB_BAR_MARGIN = 20;
const TAB_BAR_HEIGHT = 56;
const TAB_BAR_RADIUS = 28;
const TAB_COUNT = 4; // Update if you have more/less tabs
const TAB_BAR_WIDTH = width - TAB_BAR_MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

export default function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useSharedValue(state.index * TAB_WIDTH);

  React.useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, { duration: 250 });
  }, [state.index]);

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
        {state.routes.map((route, idx) => {
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
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={1}
            >
              <View style={styles.tabContent}>
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      focused: isFocused,
                      color: isFocused ? PRIMARY : "gray",
                      size: 24,
                    })
                  : null}
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? PRIMARY : "gray" },
                  ]}
                >
                  {label}
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
    bottom: 20,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  tabBarBg: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
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
    backgroundColor: "white",
    borderRadius: TAB_BAR_RADIUS,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
    zIndex: 2,
  },
  tabContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
});
