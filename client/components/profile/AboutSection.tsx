// React core
import { FlatList, StyleSheet, Text, View } from "react-native";

// Project imports
import { DARK, MUTED, PRIMARY } from "@/constants/theme";
import { useProfileSetupStore } from "@/store/profileStore";

// Constants
const CONTAINER_MARGIN_BOTTOM = 24;
const CONTAINER_PADDING = 16;
const CONTAINER_BORDER_RADIUS = 12;
const CONTAINER_BACKGROUND = "#f9fafb";
const SHADOW_COLOR = "#000";
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 6;
const TITLE_FONT_SIZE = 20;
const TITLE_FONT_WEIGHT = "700";
const TITLE_MARGIN_BOTTOM = 12;
const SUBTITLE_FONT_SIZE = 16;
const SUBTITLE_FONT_WEIGHT = "600";
const SUBTITLE_MARGIN_BOTTOM = 6;
const CONTENT_FONT_SIZE = 16;
const CONTENT_MARGIN_BOTTOM = 12;
const CONTENT_LINE_HEIGHT = 22;
const INTERESTS_GAP = 8;
const INTEREST_BADGE_PADDING_HORIZONTAL = 12;
const INTEREST_BADGE_PADDING_VERTICAL = 6;
const INTEREST_BADGE_BORDER_RADIUS = 20;
const INTEREST_TEXT_FONT_SIZE = 14;
const INTEREST_TEXT_FONT_WEIGHT = "500";

/**
 * About section component showing user bio and interests
 * Displays filtered interests in horizontal scrollable badges
 */
export default function AboutSection() {
  const { data: profile } = useProfileSetupStore();

  const bio = profile?.bio || "";
  const interests = Array.isArray(profile?.interests)
    ? profile.interests.filter(Boolean).map(String)
    : [];

  const renderInterest = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.interestBadge}>
      <Text style={styles.interestText}>{item}</Text>
    </View>
  );

  const renderInterests = () => {
    if (interests.length === 0) {
      return <Text style={styles.content}>No interests added.</Text>;
    }

    return (
      <FlatList
        data={interests}
        keyExtractor={(item, index) => `interest-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.interestsContainer}
        renderItem={renderInterest}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>

      <Text style={styles.subtitle}>Bio</Text>
      <Text style={styles.content}>{bio || "No bio provided."}</Text>

      <Text style={styles.subtitle}>Interests</Text>
      {renderInterests()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: CONTAINER_MARGIN_BOTTOM,
    padding: CONTAINER_PADDING,
    backgroundColor: CONTAINER_BACKGROUND,
    borderRadius: CONTAINER_BORDER_RADIUS,
    shadowColor: SHADOW_COLOR,
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    color: DARK,
    marginBottom: TITLE_MARGIN_BOTTOM,
  },
  subtitle: {
    fontSize: SUBTITLE_FONT_SIZE,
    fontWeight: SUBTITLE_FONT_WEIGHT,
    color: MUTED,
    marginBottom: SUBTITLE_MARGIN_BOTTOM,
  },
  content: {
    fontSize: CONTENT_FONT_SIZE,
    color: DARK,
    marginBottom: CONTENT_MARGIN_BOTTOM,
    lineHeight: CONTENT_LINE_HEIGHT,
  },
  interestsContainer: {
    flexDirection: "row",
    gap: INTERESTS_GAP,
  },
  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: INTEREST_BADGE_PADDING_HORIZONTAL,
    paddingVertical: INTEREST_BADGE_PADDING_VERTICAL,
    borderRadius: INTEREST_BADGE_BORDER_RADIUS,
  },
  interestText: {
    color: "white",
    fontWeight: INTEREST_TEXT_FONT_WEIGHT,
    fontSize: INTEREST_TEXT_FONT_SIZE,
  },
});
