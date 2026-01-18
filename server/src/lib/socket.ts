import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "@/config/logger";

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 * @param server - HTTP server instance from Express
 */
export function initSocket(server: HTTPServer) {
  if (io) return io; // already initialized

  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // adjust to frontend domain in prod!!!
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info("SOCKET_CONNECTED", { socketId: socket.id });

    socket.on("disconnect", (reason) => {
      logger.info("SOCKET_DISCONNECTED", { socketId: socket.id, reason });
    });

    // Example
    socket.on("ping", () => {
      logger.info("PING_RECEIVED", { socketId: socket.id });
      socket.emit("pong");
    });
  });

  return io;
}

/**
 * Get the initialized Socket.IO instance
 */
export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
