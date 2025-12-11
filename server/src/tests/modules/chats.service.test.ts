import * as ChatsService from "@/modules/chats/services";
import prisma from "@/lib/prismaClient";
import logger from "@/config/logger";

jest.mock("@/lib/prismaClient", () => ({
  __esModule: true,
  default: {
    matches: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    chats: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock("@/config/logger");

describe("ChatsService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("getConversations", () => {
    it("should get conversations successfully", async () => {
      const mockMatches = [
        {
          id: "match1",
          user1: "user1",
          user2: "user2",
          matched_at: new Date("2024-01-01"),
          chats: [
            {
              id: "msg1",
              message: "Hello!",
              sender_id: "user2",
              sent_at: new Date("2024-01-02"),
              is_read: false,
            },
          ],
          users_matches_user1Tousers: {
            id: "user1",
            profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
          },
          users_matches_user2Tousers: {
            id: "user2",
            profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
          },
        },
      ];

      (prisma.matches.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.chats.count as jest.Mock).mockResolvedValue(1);

      const result = await ChatsService.getConversations("user1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "match1",
        matchId: "match1",
        otherUser: {
          id: "user2",
          name: "Bob",
          avatar_url: "https://avatar2.jpg",
        },
        lastMessage: {
          id: "msg1",
          content: "Hello!",
          senderId: "user2",
          isRead: false,
        },
        unreadCount: 1,
      });

      expect(prisma.matches.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
        include: expect.any(Object),
      });
    });

    it("should return empty array if no matches found", async () => {
      (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);

      const result = await ChatsService.getConversations("user1");

      expect(result).toEqual([]);
      expect(prisma.matches.findMany).toHaveBeenCalled();
    });

    it("should handle matches without messages", async () => {
      const mockMatches = [
        {
          id: "match1",
          user1: "user1",
          user2: "user2",
          matched_at: new Date("2024-01-01"),
          chats: [],
          users_matches_user1Tousers: {
            id: "user1",
            profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
          },
          users_matches_user2Tousers: {
            id: "user2",
            profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
          },
        },
      ];

      (prisma.matches.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.chats.count as jest.Mock).mockResolvedValue(0);

      const result = await ChatsService.getConversations("user1");

      expect(result).toHaveLength(1);
      expect(result[0].lastMessage).toBeNull();
      expect(result[0].unreadCount).toBe(0);
    });

    it("should sort conversations by most recent message", async () => {
      const mockMatches = [
        {
          id: "match1",
          user1: "user1",
          user2: "user2",
          matched_at: new Date("2024-01-01"),
          chats: [
            {
              id: "msg1",
              message: "Old message",
              sender_id: "user2",
              sent_at: new Date("2024-01-02"),
              is_read: true,
            },
          ],
          users_matches_user1Tousers: {
            id: "user1",
            profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
          },
          users_matches_user2Tousers: {
            id: "user2",
            profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
          },
        },
        {
          id: "match2",
          user1: "user1",
          user2: "user3",
          matched_at: new Date("2024-01-01"),
          chats: [
            {
              id: "msg2",
              message: "New message",
              sender_id: "user3",
              sent_at: new Date("2024-01-05"),
              is_read: false,
            },
          ],
          users_matches_user1Tousers: {
            id: "user1",
            profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
          },
          users_matches_user2Tousers: {
            id: "user3",
            profiles: { name: "Charlie", avatar_url: "https://avatar3.jpg" },
          },
        },
      ];

      (prisma.matches.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.chats.count as jest.Mock).mockResolvedValue(1);

      const result = await ChatsService.getConversations("user1");

      // Most recent message should be first
      expect(result[0].matchId).toBe("match2");
      expect(result[1].matchId).toBe("match1");
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database connection failed");
      (prisma.matches.findMany as jest.Mock).mockRejectedValue(error);

      await expect(ChatsService.getConversations("user1")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getMessages", () => {
    it("should get messages successfully", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
        users_matches_user1Tousers: {
          id: "user1",
          profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
        },
        users_matches_user2Tousers: {
          id: "user2",
          profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
        },
      };

      const mockMessages = [
        {
          id: "msg2",
          message: "Second message",
          sender_id: "user1",
          sent_at: new Date("2024-01-02"),
        },
        {
          id: "msg1",
          message: "First message",
          sender_id: "user2",
          sent_at: new Date("2024-01-01"),
        },
      ];

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await ChatsService.getMessages("user1", "match1");

      expect(result.matchId).toBe("match1");
      expect(result.otherUser.name).toBe("Bob");
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].id).toBe("msg1"); // Oldest first
      expect(result.messages[1].id).toBe("msg2");

      expect(prisma.matches.findFirst).toHaveBeenCalledWith({
        where: {
          id: "match1",
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
        include: expect.any(Object),
      });

      expect(prisma.chats.findMany).toHaveBeenCalledWith({
        where: { match_id: "match1" },
        orderBy: { sent_at: "desc" },
        take: 50,
      });
    });

    it("should apply pagination with before cursor", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
        users_matches_user1Tousers: {
          id: "user1",
          profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
        },
        users_matches_user2Tousers: {
          id: "user2",
          profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
        },
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      const beforeDate = "2024-01-05T00:00:00.000Z";
      await ChatsService.getMessages("user1", "match1", 20, beforeDate);

      expect(prisma.chats.findMany).toHaveBeenCalledWith({
        where: {
          match_id: "match1",
          sent_at: { lt: new Date(beforeDate) },
        },
        orderBy: { sent_at: "desc" },
        take: 20,
      });
    });

    it("should throw error if match not found", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.getMessages("user1", "match1")
      ).rejects.toThrow("Match not found or user not authorized");

      expect(prisma.chats.findMany).not.toHaveBeenCalled();
    });

    it("should throw error if user not authorized for match", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.getMessages("wrongUser", "match1")
      ).rejects.toThrow("Match not found or user not authorized");
    });

    it("should return empty messages array if no messages", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
        users_matches_user1Tousers: {
          id: "user1",
          profiles: { name: "Alice", avatar_url: "https://avatar1.jpg" },
        },
        users_matches_user2Tousers: {
          id: "user2",
          profiles: { name: "Bob", avatar_url: "https://avatar2.jpg" },
        },
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      const result = await ChatsService.getMessages("user1", "match1");

      expect(result.messages).toEqual([]);
    });
  });

  describe("sendMessage", () => {
    it("should send message successfully", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      const mockChat = {
        id: "msg1",
        match_id: "match1",
        sender_id: "user1",
        message: "Hello!",
        message_type: "TEXT",
        is_read: false,
        sent_at: new Date(),
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockResolvedValue(mockChat);

      const result = await ChatsService.sendMessage(
        "user1",
        "match1",
        "Hello!",
        "TEXT"
      );

      expect(result).toEqual(mockChat);
      expect(prisma.matches.findFirst).toHaveBeenCalledWith({
        where: {
          id: "match1",
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
      });
      expect(prisma.chats.create).toHaveBeenCalledWith({
        data: {
          match_id: "match1",
          sender_id: "user1",
          message: "Hello!",
          message_type: "TEXT",
          media_url: undefined,
          is_read: false,
        },
      });
      expect(logger.info).toHaveBeenCalledWith("Message sent", {
        matchId: "match1",
        messageId: "msg1",
        senderId: "user1",
        type: "TEXT",
      });
    });

    it("should send image message with media_url", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      const mockChat = {
        id: "msg1",
        match_id: "match1",
        sender_id: "user1",
        message: "",
        message_type: "IMAGE",
        media_url: "https://image.jpg",
        is_read: false,
        sent_at: new Date(),
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockResolvedValue(mockChat);

      const result = await ChatsService.sendMessage(
        "user1",
        "match1",
        "",
        "IMAGE",
        "https://image.jpg"
      );

      expect(result).toEqual(mockChat);
      expect(prisma.chats.create).toHaveBeenCalledWith({
        data: {
          match_id: "match1",
          sender_id: "user1",
          message: "",
          message_type: "IMAGE",
          media_url: "https://image.jpg",
          is_read: false,
        },
      });
    });

    it("should throw error if match not found", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.sendMessage("user1", "match1", "Hello!")
      ).rejects.toThrow("Match not found or user not authorized");

      expect(prisma.chats.create).not.toHaveBeenCalled();
    });

    it("should throw error if user not authorized for match", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.sendMessage("wrongUser", "match1", "Hello!")
      ).rejects.toThrow("Match not found or user not authorized");
    });

    it("should handle database errors during message creation", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      const error = new Error("Database error");
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockRejectedValue(error);

      await expect(
        ChatsService.sendMessage("user1", "match1", "Hello!")
      ).rejects.toThrow("Database error");
    });
  });

  describe("markAsRead", () => {
    it("should mark messages as read successfully", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      const updateResult = { count: 3 };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue(updateResult);

      const result = await ChatsService.markAsRead("user1", "match1");

      expect(result.count).toBe(3);
      expect(prisma.matches.findFirst).toHaveBeenCalledWith({
        where: {
          id: "match1",
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
      });
      expect(prisma.chats.updateMany).toHaveBeenCalledWith({
        where: {
          match_id: "match1",
          sender_id: { not: "user1" },
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: expect.any(Date),
        },
      });
      expect(logger.info).toHaveBeenCalledWith("Messages marked as read", {
        matchId: "match1",
        userId: "user1",
        count: 3,
      });
    });

    it("should throw error if match not found", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.markAsRead("user1", "match1")
      ).rejects.toThrow("Match not found or user not authorized");

      expect(prisma.chats.updateMany).not.toHaveBeenCalled();
    });

    it("should mark zero messages if all already read", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await ChatsService.markAsRead("user1", "match1");

      expect(result.count).toBe(0);
    });
  });

  describe("deleteMessage", () => {
    it("should delete message successfully", async () => {
      const mockMessage = {
        id: "msg1",
        sender_id: "user1",
        message: "Delete me",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.delete as jest.Mock).mockResolvedValue(mockMessage);

      await ChatsService.deleteMessage("user1", "msg1");

      expect(prisma.chats.findUnique).toHaveBeenCalledWith({
        where: { id: "msg1" },
      });
      expect(prisma.chats.delete).toHaveBeenCalledWith({
        where: { id: "msg1" },
      });
      expect(logger.info).toHaveBeenCalledWith("Message deleted", {
        messageId: "msg1",
        userId: "user1",
      });
    });

    it("should throw error if message not found", async () => {
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatsService.deleteMessage("user1", "msg1")
      ).rejects.toThrow("Message not found");

      expect(prisma.chats.delete).not.toHaveBeenCalled();
    });

    it("should throw error if user not authorized to delete", async () => {
      const mockMessage = {
        id: "msg1",
        sender_id: "user2",
        message: "Not your message",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        ChatsService.deleteMessage("user1", "msg1")
      ).rejects.toThrow("Not authorized to delete this message");

      expect(prisma.chats.delete).not.toHaveBeenCalled();
    });

    it("should handle database errors during deletion", async () => {
      const mockMessage = {
        id: "msg1",
        sender_id: "user1",
        message: "Delete me",
      };

      const error = new Error("Database error");
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.delete as jest.Mock).mockRejectedValue(error);

      await expect(
        ChatsService.deleteMessage("user1", "msg1")
      ).rejects.toThrow("Database error");
    });
  });

  describe("getUnreadCount", () => {
    it("should get unread count successfully", async () => {
      const mockMatches = [
        { id: "match1" },
        { id: "match2" },
        { id: "match3" },
      ];

      (prisma.matches.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.chats.count as jest.Mock).mockResolvedValue(5);

      const result = await ChatsService.getUnreadCount("user1");

      expect(result).toBe(5);
      expect(prisma.matches.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
        select: { id: true },
      });
      expect(prisma.chats.count).toHaveBeenCalledWith({
        where: {
          match_id: { in: ["match1", "match2", "match3"] },
          sender_id: { not: "user1" },
          is_read: false,
        },
      });
    });

    it("should return 0 if no matches", async () => {
      (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.chats.count as jest.Mock).mockResolvedValue(0);

      const result = await ChatsService.getUnreadCount("user1");

      expect(result).toBe(0);
    });

    it("should return 0 if all messages are read", async () => {
      const mockMatches = [{ id: "match1" }];

      (prisma.matches.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.chats.count as jest.Mock).mockResolvedValue(0);

      const result = await ChatsService.getUnreadCount("user1");

      expect(result).toBe(0);
    });
  });

  describe("verifyMatchAccess", () => {
    it("should return true if user has access to match", async () => {
      const mockMatch = {
        id: "match1",
        user1: "user1",
        user2: "user2",
      };

      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(mockMatch);

      const result = await ChatsService.verifyMatchAccess("user1", "match1");

      expect(result).toBe(true);
      expect(prisma.matches.findFirst).toHaveBeenCalledWith({
        where: {
          id: "match1",
          OR: [{ user1: "user1" }, { user2: "user1" }],
        },
      });
    });

    it("should return false if user does not have access", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ChatsService.verifyMatchAccess("user1", "match1");

      expect(result).toBe(false);
    });

    it("should return false if match does not exist", async () => {
      (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ChatsService.verifyMatchAccess(
        "user1",
        "nonexistent"
      );

      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (prisma.matches.findFirst as jest.Mock).mockRejectedValue(error);

      await expect(
        ChatsService.verifyMatchAccess("user1", "match1")
      ).rejects.toThrow("Database error");
    });
  });
});