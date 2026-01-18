// React Native
import { StyleSheet, Text, View } from "react-native";

// Third-party
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

// Project imports
import { DARK, GRADIENT } from "@/constants/theme";

// Constants
const LOGO_FONT_SIZE = 42;
const SUBTITLE_FONT_SIZE = 18;
const SUBTITLE_MARGIN_TOP = 12;

/**
 * Header section with gradient brand name and tagline
 * Displays "findU" text with gradient color fill
 */
export default function HeaderSection() {
  return (
    <View style={styles.container}>
      {/* Gradient masked text for brand name */}
      <MaskedView
        maskElement={
          <Text style={styles.logo}>findU</Text>
        }
      >
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientText}
        >
          {/* Invisible text sets gradient size */}
          <Text style={[styles.logo, { opacity: 0 }]}>findU</Text>
        </LinearGradient>
      </MaskedView>

      {/* Tagline subtitle */}
      <Text style={styles.subtitle}>Where college hearts connect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  logo: {
    fontSize: LOGO_FONT_SIZE,
    fontWeight: "bold",
    textAlign: "center",
  },
  gradientText: {
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: SUBTITLE_FONT_SIZE,
    color: DARK,
    textAlign: "center",
    marginTop: SUBTITLE_MARGIN_TOP,
  },
});


// Floating findU
// import { useEffect, useRef } from "react";
// import { View, Text, StyleSheet, Animated, Easing } from "react-native";
// import MaskedView from "@react-native-masked-view/masked-view";
// import { LinearGradient } from "expo-linear-gradient";
// import { DARK, GRADIENT } from "../../constants/theme";

// export default function HeaderSection() {
//   const translateY = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(translateY, {
//           toValue: -10, // float up
//           duration: 1500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateY, {
//           toValue: 0, // float down
//           duration: 1500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, [translateY]);

//   return (
//     <View style={styles.container}>
//       {/* Floating Gradient Logo */}
//       <Animated.View style={{ transform: [{ translateY }] }}>
//         <MaskedView maskElement={<Text style={styles.logo}>findU</Text>}>
//           <LinearGradient
//             colors={GRADIENT}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.gradientText}
//           >
//             {/* Invisible text ensures gradient has size */}
//             <Text style={[styles.logo, { opacity: 0 }]}>findU</Text>
//           </LinearGradient>
//         </MaskedView>
//       </Animated.View>

//       {/* Subtitle */}
//       <Text style={styles.subtitle}>Where college hearts connect</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     alignItems: "center",
//   },
//   logo: {
//     fontSize: 42,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   gradientText: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   subtitle: {
//     fontSize: 18,
//     color: DARK,
//     textAlign: "center",
//     marginTop: 16, // keeps consistent gap below floating logo
//   },
// });
