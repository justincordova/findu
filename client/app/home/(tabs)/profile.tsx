import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const user = {
  name: "Zachary Labit",
  email: "labit.z@northeastern.edu",
  bio: "CS major, coffee enthusiast, and aspiring entrepreneur. Looking to meet new people!",
  profilePicture: "https://ui-avatars.com/api/?name=Zachary+Labit&background=ec4899&color=fff&size=256",
  school: "Northeastern University",
  major: "Computer Science",
  gradYear: "2026",
  pronouns: "he/him",
  intent: ["True Love", "Study Buddy"],
  age: 21,
};

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profilePicture}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.pronouns}>{user.pronouns}</Text>
        <Text style={styles.bio}>{user.bio}</Text>

        <View style={styles.intentContainer}>
          {user.intent.map((i) => (
            <View key={i} style={styles.intentBadge}>
              <Text style={styles.intentText}>{i}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Details</Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>School</Text>
            <Text style={styles.detailsValue}>{user.school}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Major</Text>
            <Text style={styles.detailsValue}>{user.major}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Grad Year</Text>
            <Text style={styles.detailsValue}>{user.gradYear}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Age</Text>
            <Text style={styles.detailsValue}>{user.age}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/profile-setup/1")}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.push("../index.tsx")}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const PRIMARY_COLOR = "#ec4899";
const BACKGROUND_COLOR = "#fff";
const BACKGROUND_SCROLL = "#f0f0f0";
const DARK_COLOR = "#222";
const MUTED_COLOR = "#888";
const PINK_LIGHT = "#fce4ec";
const PINK_BORDER = "#f48fb1";

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: BACKGROUND_SCROLL,
  },
  contentContainer: {
    alignItems: "center",
    padding: 24,
    justifyContent: "flex-end",
    minHeight: "100%",
  },
  profileContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 96,
  },
  profilePicture: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: PRIMARY_COLOR,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK_COLOR,
    marginBottom: 4,
  },
  pronouns: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  bio: {
    fontSize: 18,
    textAlign: "center",
    color: DARK_COLOR,
    marginBottom: 16,
  },
  intentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  intentBadge: {
    backgroundColor: PINK_LIGHT,
    borderColor: PINK_BORDER,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  intentText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  detailsBox: {
    width: "100%",
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK_COLOR,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailsLabel: {
    color: MUTED_COLOR,
    fontWeight: "500",
  },
  detailsValue: {
    color: DARK_COLOR,
  },
  editButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 9999,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 8,
  },
  editButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 9999,
    paddingVertical: 12,
    width: "100%",
  },
  logoutButtonText: {
    color: DARK_COLOR,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
