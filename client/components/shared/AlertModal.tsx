// React core

// Icons
import { Ionicons } from "@expo/vector-icons";
// React Native
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Project imports
import { PRIMARY } from "@/constants/theme";

// Constants
const CONTENT_MAX_WIDTH = 400;
const CONTENT_PADDING = 24;
const BORDER_RADIUS = 16;
const BUTTON_PADDING_VERTICAL = 12;
const BUTTON_PADDING_HORIZONTAL = 32;
const BUTTON_BORDER_RADIUS = 12;
const BUTTON_MIN_WIDTH = 120;

// Types
interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "info" | "error" | "warning" | "success";
  onConfirm?: () => void;
}

/**
 * Alert/confirmation modal component
 * Displays messages with icons based on type (info, error, warning, success)
 * Supports optional confirmation callback for confirmation dialogs
 */

export default function AlertModal({
  visible,
  title,
  message,
  onClose,
  type = "info",
  onConfirm,
}: AlertModalProps) {
  console.log("AlertModal render:", {
    visible,
    title,
    message,
    type,
    hasOnConfirm: !!onConfirm,
  });

  const getIcon = () => {
    switch (type) {
      case "error":
        return <Ionicons name="close-circle" size={48} color="#EF4444" />;
      case "warning":
        return <Ionicons name="warning" size={48} color="#F59E0B" />;
      case "success":
        return <Ionicons name="checkmark-circle" size={48} color="#10B981" />;
      default:
        return <Ionicons name="information-circle" size={48} color={PRIMARY} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>{getIcon()}</View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {onConfirm ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "white",
    borderRadius: BORDER_RADIUS,
    padding: CONTENT_PADDING,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    minWidth: BUTTON_MIN_WIDTH,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
    flex: 1,
  },
  confirmButton: {
    backgroundColor: PRIMARY,
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#374151",
  },
});
