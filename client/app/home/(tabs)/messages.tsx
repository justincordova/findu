import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { BACKGROUND, DARK, MUTED, PRIMARY } from '@/constants/theme';
import { getConversations } from '@/services/chatService';
import { Conversation } from '@/types/Message';

const AVATAR_SIZE = 56;
const AVATAR_BORDER_RADIUS = 28;

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false); // 👈 Start as false
  const [refreshing, setRefreshing] = useState(false);

  // ✅ CORRECT - useCallback with empty deps, called by useFocusEffect
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    const res = await getConversations();
    
    if (res.success && res.data?.conversations) {
      setConversations(res.data.conversations);
    } else if (res.error) {
      Alert.alert('Error', res.error);
    }
    
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations(false);
  }, [fetchConversations]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.otherUser.avatar_url }}
        style={styles.avatar}
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {item.otherUser.name}
          </Text>
          {item.lastMessage && (
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessage.sentAt)}
            </Text>
          )}
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.content || 'Say hi! 👋'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
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
      <Text style={styles.headerTitle}>Messages</Text>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start matching to begin chatting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: DARK,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: MUTED,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: MUTED,
  },
  unreadMessage: {
    fontWeight: '600',
    color: DARK,
  },
  unreadBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: MUTED,
    textAlign: 'center',
  },
});