import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BACKGROUND, DARK, MUTED, PRIMARY } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import {
  getMessages,
  sendMessage as sendMessageService,
  markAsRead,
} from '@/services/chatService';
import { ConversationDetail, Message } from '@/types/Message';

const HEADER_AVATAR_SIZE = 36;
const HEADER_AVATAR_BORDER_RADIUS = 18;

export default function ChatScreen() {
  const router = useRouter();
  const { id: matchId } = useLocalSearchParams();
  const userId = useAuthStore((state) => state.userId);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');

  const flatListRef = useRef<FlatList>(null);

  // Fetch conversation
  const fetchConversation = useCallback(async () => {
    setLoading(true);
    const res = await getMessages(matchId as string);
    
    if (res.success && res.data?.conversation) {
      setConversation(res.data.conversation);
      setMessages(res.data.conversation.messages);
    } else {
      Alert.alert('Error', res.error || 'Failed to load conversation');
    }
    
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchConversation();
    
    // Mark as read when entering chat
    markAsRead(matchId as string);
  }, [matchId, fetchConversation]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistic UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      match_id: matchId as string,
      sender_id: userId!,
      message: content,
      message_type: 'TEXT',
      is_read: false,
      sent_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send to backend
    const res = await sendMessageService(matchId as string, content);
    
    if (res.success && res.data?.message) {
      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? res.data.message : msg
        )
      );
    } else {
      // Remove temp message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      Alert.alert('Error', res.error || 'Failed to send message');
    }

    setSending(false);
  }, [messageText, sending, matchId, userId]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === userId;
    const formattedTime = new Date(item.sent_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            ]}
          >
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Image
          source={{ uri: conversation?.otherUser.avatar_url }}
          style={styles.headerAvatar}
        />
        <Text style={styles.headerName} numberOfLines={1}>
          {conversation?.otherUser.name}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>Start the conversation! 👋</Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 12,
  },
  headerAvatar: {
    width: HEADER_AVATAR_SIZE,
    height: HEADER_AVATAR_SIZE,
    borderRadius: HEADER_AVATAR_BORDER_RADIUS,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: PRIMARY,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: 'white',
  },
  otherText: {
    color: DARK,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: MUTED,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: DARK,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: MUTED,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: MUTED,
  },
});