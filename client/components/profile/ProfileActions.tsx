import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { PRIMARY, DARK, BACKGROUND } from "../../constants/theme";

interface ProfileActionsProps {
  onEditProfile: () => void;
  onLogOut: () => void;
}

export default function ProfileActions({
  onEditProfile,
  onLogOut,
}: ProfileActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogOut}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  editButton: {
    backgroundColor: PRIMARY,
    borderRadius: 25,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 8,
  },
  editButtonText: {
    color: BACKGROUND,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 25,
    paddingVertical: 12,
    width: "100%",
  },
  logoutButtonText: {
    color: DARK,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
