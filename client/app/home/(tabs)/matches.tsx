// React core
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from 'expo-router';

// React Native
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";
import { getMatches } from "@/services/matchesService";

// Types
interface Match {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  matched_at: string;
}

// Constants
const AVATAR_SIZE = 60;
const AVATAR_BORDER_RADIUS = 30;
const MATCH_ITEM_MARGIN_BOTTOM = 12;
const AVATAR_MARGIN_RIGHT = 16;

/**
 * Matches screen - displays list of current matches
 * Shows matched user profiles with match timestamps
 */

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    const res = await getMatches();
    if (res.success && res.data) {
      setMatches(res.data);
    } else {
      Alert.alert("Error", "Failed to load matches.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const renderItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchItem}
      onPress={() => router.push(`/chat/${item.id}` as any)} // 👈 ADD THIS
    >
      <Image source={{ uri: item.otherUser.avatar_url }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.otherUser.name}</Text>
        <Text style={styles.timestamp}>
          Matched on {new Date(item.matched_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Matches</Text>
      {matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No matches yet.</Text>
          <Text style={styles.subtitle}>Keep swiping to find people!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: MATCH_ITEM_MARGIN_BOTTOM,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    marginRight: AVATAR_MARGIN_RIGHT,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
  },
  timestamp: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 16,
  },
});
