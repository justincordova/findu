import React from "react";
import { View, ScrollView, Image, StyleSheet, Text } from "react-native";

interface PhotosSectionProps {
  photos: string[];
}

const PHOTO_SIZE = 100;

export default function PhotosSection({ photos }: PhotosSectionProps) {
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photos added</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {photos.map((uri, idx) => (
        <Image
          key={idx}
          source={{ uri }}
          style={styles.photo}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
});
