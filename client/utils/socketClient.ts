import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { ChatMessage } from "@/types/chat";

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection with Bearer token authentication
 * Handles all event listeners for real-time messaging
 */
export function initializeSocket(): Socket | null {
  const { token } = useAuthStore.getState();

  if (!token) {
    console.error("No auth token available for socket connection");
    return null;
  }

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

  try {
    socket = io(API_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event
    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    // Receive message
    socket.on("message_received", (data: any) => {
      try {
        const { matchId, userId, message, media_url, message_type, sent_at, id } = data;
        const chatMessage: ChatMessage = {
          id,
          match_id: matchId,
          sender_id: userId,
          message,
          is_read: false,
          read_at: null,
          sent_at,
          edited_at: null,
          media_url,
          message_type: message_type || "TEXT",
        };
        useChatStore.getState().addMessage(matchId, chatMessage);
      } catch (error) {
        console.error("Error handling message_received event:", error);
      }
    });

    // User typing
    socket.on("user_typing", (data: any) => {
      try {
        const { matchId } = data;
        useChatStore.getState().setUserTyping(matchId, true);
      } catch (error) {
        console.error("Error handling user_typing event:", error);
      }
    });

    // User stop typing
    socket.on("user_stop_typing", (data: any) => {
      try {
        const { matchId } = data;
        useChatStore.getState().setUserTyping(matchId, false);
      } catch (error) {
        console.error("Error handling user_stop_typing event:", error);
      }
    });

    // Messages read
    socket.on("messages_read", (data: any) => {
      try {
        const { matchId } = data;
        useChatStore.getState().markAsRead(matchId);
      } catch (error) {
        console.error("Error handling messages_read event:", error);
      }
    });

    // User online
    socket.on("user_online", (data: any) => {
      try {
        const { matchId } = data;
        useChatStore.getState().setOtherUserOnline(matchId, true);
      } catch (error) {
        console.error("Error handling user_online event:", error);
      }
    });

    // User offline
    socket.on("user_offline", (data: any) => {
      try {
        const { matchId } = data;
        useChatStore.getState().setOtherUserOnline(matchId, false);
      } catch (error) {
        console.error("Error handling user_offline event:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return socket;
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return null;
  }
}

/**
 * Join a match room to receive real-time updates
 */
export function joinMatch(matchId: string): void {
  if (!socket) {
    console.error("Socket not initialized - call initializeSocket() first");
    return;
  }

  try {
    socket.emit("join_match", matchId);
  } catch (error) {
    console.error("Error joining match:", error);
  }
}

/**
 * Leave a match room to stop receiving updates
 */
export function leaveMatch(matchId: string): void {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  try {
    socket.emit("leave_match", matchId);
  } catch (error) {
    console.error("Error leaving match:", error);
  }
}

/**
 * Send a message through the socket
 */
export function sendMessageSocket(
  matchId: string,
  message: string,
  mediaUrl?: string,
  messageType: "TEXT" | "IMAGE" | "VIDEO" = "TEXT"
): void {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  try {
    socket.emit("message_send", {
      matchId,
      message,
      media_url: mediaUrl,
      message_type: messageType,
    });
  } catch (error) {
    console.error("Error sending message via socket:", error);
  }
}

/**
 * Emit typing indicator to other user
 */
export function emitTyping(matchId: string): void {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  try {
    socket.emit("typing", { matchId });
  } catch (error) {
    console.error("Error emitting typing indicator:", error);
  }
}

/**
 * Emit stop typing indicator to other user
 */
export function emitStopTyping(matchId: string): void {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  try {
    socket.emit("stop_typing", { matchId });
  } catch (error) {
    console.error("Error emitting stop typing indicator:", error);
  }
}

/**
 * Mark messages as read in a match
 */
export function markReadSocket(matchId: string): void {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }

  try {
    socket.emit("mark_read", { matchId });
  } catch (error) {
    console.error("Error marking messages as read via socket:", error);
  }
}

/**
 * Disconnect the socket connection
 */
export function disconnectSocket(): void {
  if (socket) {
    try {
      socket.disconnect();
      socket = null;
      console.log("Socket disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting socket:", error);
    }
  }
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}
