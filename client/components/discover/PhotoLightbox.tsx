import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PhotoLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export default function PhotoLightbox({
  uri,
  visible,
  onClose,
}: PhotoLightboxProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      {/* Dark Backdrop - Tap to close */}
      <Pressable
        onPress={onClose}
        style={styles.backdrop}
        accessible={false}
      >
        {/* Image - Don't close on tap */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.imageContainer}
          accessible={false}
        >
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        </Pressable>
      </Pressable>

      {/* Close Button */}
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="white" />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});
