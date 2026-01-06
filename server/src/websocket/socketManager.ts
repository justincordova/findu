import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { markMessagesAsRead, createMessage } from "@/modules/chats/services";
import { AuthService } from "@/modules/auth/services";
import logger from "@/config/logger";

interface SocketUser {
  userId: string;
  matchIds: string[];
}

export const userSockets = new Map<string, SocketUser>();

/**
 * Verify socket token using the same auth service as the REST API
 * @param token - Bearer token string (e.g., "Bearer <session_token>")
 * @returns userId if valid, throws error otherwise
 */
async function verifySocketToken(token: string): Promise<string> {
  const parts = token.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error("Invalid token format");
  }

  const sessionToken = parts[1];
  const user = await AuthService.verifySession(sessionToken);

  if (!user) {
    throw new Error("Invalid or expired session");
  }

  return user.id;
}

/**
 * Initialize Socket.IO server with messaging handlers
 */
export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Middleware: authenticate socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    // Verify token and attach userId to socket
    try {
      const userId = await verifySocketToken(token);
      socket.data.userId = userId;
      logger.info("SOCKET_AUTH_SUCCESS", { userId, socketId: socket.id });
      next();
    } catch (error) {
      logger.error("SOCKET_AUTH_FAILED", { error, socketId: socket.id });
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info("SOCKET_CONNECTED", { socketId: socket.id, userId });

    // Track user connection
    userSockets.set(socket.id, {
      userId,
      matchIds: [],
    });

    // Handle joining a conversation room
    socket.on("join_match", (matchId: string) => {
      try {
        socket.join(`match_${matchId}`);

        const user = userSockets.get(socket.id);
        if (user && !user.matchIds.includes(matchId)) {
          user.matchIds.push(matchId);
        }

        logger.info("USER_JOINED_CONVERSATION", { userId, matchId, socketId: socket.id });

        // Notify other user in conversation that this user is online
        socket.to(`match_${matchId}`).emit("user_online", { matchId, userId });
      } catch (err) {
        logger.error("Error joining conversation", err);
      }
    });

    // Handle leaving a conversation room
    socket.on("leave_match", (matchId: string) => {
      try {
        socket.leave(`match_${matchId}`);

        const user = userSockets.get(socket.id);
        if (user) {
          user.matchIds = user.matchIds.filter((id) => id !== matchId);
        }

        logger.info("USER_LEFT_CONVERSATION", { userId, matchId, socketId: socket.id });

        // Notify other user that this user is offline
        socket.to(`match_${matchId}`).emit("user_offline", { matchId, userId });
      } catch (err) {
        logger.error("Error leaving conversation", err);
      }
    });

    // Handle incoming message
    socket.on("message_send", async (data) => {
      try {
        const { matchId, message, media_url, message_type } = data;

        logger.info("MESSAGE_SEND", { userId, matchId, messageType: message_type });

        // Persist message to database
        const savedMessage = await createMessage({
          match_id: matchId,
          sender_id: userId,
          message,
          media_url,
          message_type: message_type || "TEXT",
        });

        // Broadcast to match room with the DB-generated ID
        io.to(`match_${matchId}`).emit("message_received", {
          id: savedMessage.id,
          match_id: savedMessage.match_id,
          sender_id: savedMessage.sender_id,
          message: savedMessage.message,
          is_read: savedMessage.is_read,
          read_at: savedMessage.read_at,
          media_url: savedMessage.media_url,
          message_type: savedMessage.message_type,
          sent_at: savedMessage.sent_at,
          edited_at: savedMessage.edited_at,
        });
      } catch (err) {
        logger.error("Error in message_send handler", err);
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      try {
        const { matchId } = data;
        logger.info("USER_TYPING", { userId, matchId });
        socket.to(`match_${matchId}`).emit("user_typing", { matchId, userId });
      } catch (err) {
        logger.error("Error in typing handler", err);
      }
    });

    // Handle stop typing
    socket.on("stop_typing", (data) => {
      try {
        const { matchId } = data;
        logger.info("USER_STOP_TYPING", { userId, matchId });
        socket.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId });
      } catch (err) {
        logger.error("Error in stop_typing handler", err);
      }
    });

    // Handle mark as read
    socket.on("mark_read", async (data) => {
      try {
        const { matchId } = data;
        logger.info("MARK_READ_REQUEST", { userId, matchId });

        await markMessagesAsRead(matchId, userId);
        socket.to(`match_${matchId}`).emit("messages_read", { matchId, userId });
      } catch (err) {
        logger.error("Error marking messages as read", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      try {
        const user = userSockets.get(socket.id);
        if (user) {
          user.matchIds.forEach((matchId) => {
            socket.to(`match_${matchId}`).emit("user_offline", { matchId, userId });
          });
        }
        userSockets.delete(socket.id);
        logger.info("SOCKET_DISCONNECTED", { socketId: socket.id, userId });
      } catch (err) {
        logger.error("Error in disconnect handler", err);
      }
    });
  });

  return io;
}
