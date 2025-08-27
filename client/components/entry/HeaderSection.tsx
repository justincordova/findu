import { View, Text, StyleSheet } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { DARK, GRADIENT } from "../../constants/theme";

export default function HeaderSection() {
  return (
    <View style={styles.container}>
      {/* Gradient Text for findU */}
      <MaskedView
        maskElement={
          <Text style={styles.logo}>findU</Text>
        }
      >
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }} // left → right gradient
          style={styles.gradientText}
        >
          {/* Invisible text ensures the gradient has correct size */}
          <Text style={[styles.logo, { opacity: 0 }]}>findU</Text>
        </LinearGradient>
      </MaskedView>

      <Text style={styles.subtitle}>Where college hearts connect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
  },
  gradientText: {
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 18,
    color: DARK,
    textAlign: "center",
    marginTop: 12, // ensures gap from logo
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
