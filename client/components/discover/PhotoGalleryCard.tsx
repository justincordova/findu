import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PhotoGalleryCardProps {
  photos: string[];
  avatarUrl: string;
  onAvatarTap: () => void;
  isActive: boolean;
  userName: string;
  age: number;
  bio: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function PhotoGalleryCard({
  photos,
  avatarUrl,
  onAvatarTap,
  isActive,
  userName,
  age,
  bio,
}: PhotoGalleryCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Preload all photos on mount for instant switching
  useEffect(() => {
    photos.forEach((photo) => {
      Image.prefetch(photo);
    });
    Image.prefetch(avatarUrl);
  }, [photos, avatarUrl]);

  // Use useCallback with empty dependency to ensure function reference doesn't change
  const handlePrevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No photos available</Text>
      </View>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <View style={styles.container}>
      {/* Main Photo */}
      <Image
        source={{ uri: currentPhoto }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Left Click Zone */}
      {currentPhotoIndex > 0 && isActive && (
        <Pressable
          onPress={handlePrevPhoto}
          style={styles.leftClickZone}
          hitSlop={10}
        />
      )}

      {/* Right Click Zone */}
      {currentPhotoIndex < photos.length - 1 && isActive && (
        <Pressable
          onPress={handleNextPhoto}
          style={styles.rightClickZone}
          hitSlop={10}
        />
      )}

      {/* Progress Indicators at Top */}
      {photos.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {photos.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === currentPhotoIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Avatar Circle in Top Right - Click to expand */}
      <Pressable
        onPress={onAvatarTap}
        style={styles.avatarCircle}
        disabled={!isActive}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </Pressable>

      {/* Info Gradient at Bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.gradient}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {userName}, {age}
          </Text>
          <Text style={styles.bio} numberOfLines={3}>
            {bio}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  leftClickZone: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "40%",
    height: "100%",
    borderRadius: 20,
  },
  rightClickZone: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "40%",
    height: "100%",
    borderRadius: 20,
  },
  indicatorsContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 1,
  },
  indicatorActive: {
    backgroundColor: "white",
  },
  avatarCircle: {
    position: "absolute",
    top: 40,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    overflow: "hidden",
    zIndex: 5,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 20,
    pointerEvents: "none",
  },
  infoContainer: {
    paddingRight: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
