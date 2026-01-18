import prisma from "@/lib/prismaClient";
import {
  createMessage,
  getChatHistory,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getLatestMessage,
} from "@/modules/chats/services";

// Mock Prisma
jest.mock("@/lib/prismaClient", () => ({
  matches: {
    findUnique: jest.fn(),
  },
  chats: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("Chat Services", () => {
  const mockUserId1 = "user1";
  const mockUserId2 = "user2";
  const mockMatchId = "match1";
  const mockMessageId = "msg1";
  const now = new Date("2026-01-05T12:00:00Z");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMessage", () => {
    it("should create a message for valid match", async () => {
      const mockMatch = { id: mockMatchId, user1: mockUserId1, user2: mockUserId2 };
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.matches.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await createMessage({
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
      });

      expect(result.message).toBe("Hello");
      expect(result.sender_id).toBe(mockUserId1);
      expect(result.match_id).toBe(mockMatchId);
      expect(typeof result.sent_at).toBe("string");
      expect(result.is_read).toBe(false);
    });

    it("should create a message with media and message type", async () => {
      const mockMatch = { id: mockMatchId, user1: mockUserId1, user2: mockUserId2 };
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Check this image",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: "https://example.com/image.jpg",
        message_type: "IMAGE",
      };

      (prisma.matches.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await createMessage({
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Check this image",
        media_url: "https://example.com/image.jpg",
        message_type: "IMAGE",
      });

      expect(result.media_url).toBe("https://example.com/image.jpg");
      expect(result.message_type).toBe("IMAGE");
    });

    it("should reject if user not in match", async () => {
      const mockMatch = { id: mockMatchId, user1: mockUserId1, user2: mockUserId2 };
      (prisma.matches.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(
        createMessage({
          match_id: mockMatchId,
          sender_id: "unauthorized-user",
          message: "Hello",
        })
      ).rejects.toThrow("User not part of this match");
    });

    it("should reject if match does not exist", async () => {
      (prisma.matches.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        createMessage({
          match_id: "nonexistent",
          sender_id: mockUserId1,
          message: "Hello",
        })
      ).rejects.toThrow("User not part of this match");
    });

    it("should verify Prisma create was called with correct data", async () => {
      const mockMatch = { id: mockMatchId, user1: mockUserId1, user2: mockUserId2 };
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.matches.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (prisma.chats.create as jest.Mock).mockResolvedValue(mockMessage);

      await createMessage({
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
      });

      expect(prisma.chats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            match_id: mockMatchId,
            sender_id: mockUserId1,
            message: "Hello",
            media_url: undefined,
            message_type: "TEXT",
          },
          select: expect.objectContaining({
            id: true,
            match_id: true,
            sender_id: true,
            message: true,
            is_read: true,
            sent_at: true,
            edited_at: true,
          }),
        })
      );
    });
  });

  describe("markMessagesAsRead", () => {
    it("should mark unread messages as read", async () => {
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await markMessagesAsRead(mockMatchId, mockUserId1);

      expect(result).toBe(3);
      expect(prisma.chats.updateMany).toHaveBeenCalled();
    });

    it("should verify correct where clause excludes own messages and only unread", async () => {
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await markMessagesAsRead(mockMatchId, mockUserId1);

      expect(prisma.chats.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            match_id: mockMatchId,
            sender_id: { not: mockUserId1 },
            is_read: false,
          }),
        })
      );
    });

    it("should set is_read to true and read_at to current date", async () => {
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      await markMessagesAsRead(mockMatchId, mockUserId1);

      expect(prisma.chats.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            is_read: true,
            read_at: expect.any(Date),
          }),
        })
      );
    });

    it("should return zero when no messages to mark", async () => {
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await markMessagesAsRead(mockMatchId, mockUserId1);

      expect(result).toBe(0);
    });
  });

  describe("deleteMessage", () => {
    it("should hard delete a message if sender", async () => {
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.delete as jest.Mock).mockResolvedValue({});

      const result = await deleteMessage(mockMessageId, mockUserId1);

      expect(result.id).toBe(mockMessageId);
      expect(prisma.chats.delete).toHaveBeenCalledWith({
        where: { id: mockMessageId },
      });
    });

    it("should reject if user is not sender", async () => {
      const mockMessage = { id: mockMessageId, sender_id: mockUserId1 };
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(deleteMessage(mockMessageId, mockUserId2)).rejects.toThrow(
        "Unauthorized: can only delete own messages"
      );
    });

    it("should reject if message does not exist", async () => {
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteMessage(mockMessageId, mockUserId1)).rejects.toThrow(
        "Unauthorized: can only delete own messages"
      );
    });

    it("should verify sender is checked before deletion", async () => {
      const mockMessage = {
        id: mockMessageId,
        sender_id: mockUserId1,
        match_id: mockMatchId,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.delete as jest.Mock).mockResolvedValue({});

      await deleteMessage(mockMessageId, mockUserId1);

      expect(prisma.chats.findUnique).toHaveBeenCalledWith({
        where: { id: mockMessageId },
      });
      expect(prisma.chats.delete).toHaveBeenCalledWith({
        where: { id: mockMessageId },
      });
    });
  });

  describe("editMessage", () => {
    it("should edit message if sender and set edited_at", async () => {
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      const editedMessage = {
        ...mockMessage,
        message: "Updated",
        edited_at: now,
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.update as jest.Mock).mockResolvedValue(editedMessage);

      const result = await editMessage(mockMessageId, mockUserId1, { message: "Updated" });

      expect(result.message).toBe("Updated");
      expect(result.edited_at).not.toBeNull();
      expect(typeof result.edited_at).toBe("string");
    });

    it("should reject if user is not sender", async () => {
      const mockMessage = { id: mockMessageId, sender_id: mockUserId1 };
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        editMessage(mockMessageId, mockUserId2, { message: "Updated" })
      ).rejects.toThrow("Unauthorized: can only edit own messages");
    });

    it("should reject if message does not exist", async () => {
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        editMessage(mockMessageId, mockUserId1, { message: "Updated" })
      ).rejects.toThrow("Unauthorized: can only edit own messages");
    });

    it("should use original message if new message not provided", async () => {
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Original",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        edited_at: now,
      });

      await editMessage(mockMessageId, mockUserId1, {});

      expect(prisma.chats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            message: "Original",
            edited_at: expect.any(Date),
          },
        })
      );
    });

    it("should verify Prisma update was called with edited_at", async () => {
      const mockMessage = {
        id: mockMessageId,
        sender_id: mockUserId1,
        message: "Hello",
        match_id: mockMatchId,
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        message: "Updated",
        edited_at: now,
      });

      await editMessage(mockMessageId, mockUserId1, { message: "Updated" });

      expect(prisma.chats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMessageId },
          data: expect.objectContaining({
            edited_at: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("getChatHistory", () => {
    it("should fetch chat history (hard deletes only - deleted messages completely removed)", async () => {
      const mockMessages = [
        {
          id: "msg1",
          match_id: mockMatchId,
          sender_id: mockUserId1,
          message: "First",
          is_read: true,
          read_at: new Date("2026-01-01T10:00:00Z"),
          sent_at: new Date("2026-01-01T09:00:00Z"),
          edited_at: null,
          media_url: null,
          message_type: "TEXT",
        },
      ];

      (prisma.chats.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await getChatHistory({ match_id: mockMatchId });

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe("First");
      expect(result[0].is_read).toBe(true);
      expect(typeof result[0].sent_at).toBe("string");
    });

    it("should NOT filter by deleted_at (hard delete only)", async () => {
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      await getChatHistory({ match_id: mockMatchId });

      const callArgs = (prisma.chats.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toEqual({ match_id: mockMatchId });
      expect(callArgs.where).not.toHaveProperty("deleted_at");
    });

    it("should order by sent_at descending", async () => {
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      await getChatHistory({ match_id: mockMatchId });

      expect(prisma.chats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sent_at: "desc" },
        })
      );
    });

    it("should use default limit of 50", async () => {
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      await getChatHistory({ match_id: mockMatchId });

      expect(prisma.chats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should use custom limit when provided", async () => {
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      await getChatHistory({ match_id: mockMatchId, limit: 25 });

      expect(prisma.chats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
        })
      );
    });

    it("should handle pagination with cursor", async () => {
      const cursor = "msg0";
      (prisma.chats.findMany as jest.Mock).mockResolvedValue([]);

      await getChatHistory({ match_id: mockMatchId, cursor });

      expect(prisma.chats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: cursor },
          skip: 1,
        })
      );
    });

    it("should reverse messages to get chronological order", async () => {
      const mockMessages = [
        {
          id: "msg3",
          match_id: mockMatchId,
          sender_id: mockUserId1,
          message: "Third",
          is_read: false,
          read_at: null,
          sent_at: new Date("2026-01-03"),
          edited_at: null,
          media_url: null,
          message_type: "TEXT",
        },
        {
          id: "msg2",
          match_id: mockMatchId,
          sender_id: mockUserId2,
          message: "Second",
          is_read: true,
          read_at: now,
          sent_at: new Date("2026-01-02"),
          edited_at: null,
          media_url: null,
          message_type: "TEXT",
        },
        {
          id: "msg1",
          match_id: mockMatchId,
          sender_id: mockUserId1,
          message: "First",
          is_read: true,
          read_at: now,
          sent_at: new Date("2026-01-01"),
          edited_at: null,
          media_url: null,
          message_type: "TEXT",
        },
      ];

      (prisma.chats.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await getChatHistory({ match_id: mockMatchId });

      expect(result).toHaveLength(3);
      expect(result[0].message).toBe("First");
      expect(result[1].message).toBe("Second");
      expect(result[2].message).toBe("Third");
    });

    it("should format all dates to ISO strings", async () => {
      const mockMessages = [
        {
          id: "msg1",
          match_id: mockMatchId,
          sender_id: mockUserId1,
          message: "Test",
          is_read: true,
          read_at: new Date("2026-01-05T12:00:00Z"),
          sent_at: new Date("2026-01-05T11:00:00Z"),
          edited_at: new Date("2026-01-05T11:30:00Z"),
          media_url: null,
          message_type: "TEXT",
        },
      ];

      (prisma.chats.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await getChatHistory({ match_id: mockMatchId });

      expect(result[0].read_at).toBe("2026-01-05T12:00:00.000Z");
      expect(result[0].sent_at).toBe("2026-01-05T11:00:00.000Z");
      expect(result[0].edited_at).toBe("2026-01-05T11:30:00.000Z");
      expect(result[0]).not.toHaveProperty("deleted_at");
    });
  });

  describe("getLatestMessage", () => {
    it("should fetch the latest message in a match", async () => {
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Latest",
        is_read: false,
        read_at: null,
        sent_at: now,
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findFirst as jest.Mock).mockResolvedValue(mockMessage);

      const result = await getLatestMessage(mockMatchId);

      expect(result).not.toBeNull();
      expect(result?.message).toBe("Latest");
      expect(typeof result?.sent_at).toBe("string");
    });

    it("should return null when no messages exist", async () => {
      (prisma.chats.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getLatestMessage(mockMatchId);

      expect(result).toBeNull();
    });

    it("should NOT filter by deleted_at (hard delete only - deleted messages completely removed)", async () => {
      (prisma.chats.findFirst as jest.Mock).mockResolvedValue(null);

      await getLatestMessage(mockMatchId);

      const callArgs = (prisma.chats.findFirst as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toEqual({ match_id: mockMatchId });
      expect(callArgs.where).not.toHaveProperty("deleted_at");
    });

    it("should order by sent_at descending to get latest", async () => {
      (prisma.chats.findFirst as jest.Mock).mockResolvedValue(null);

      await getLatestMessage(mockMatchId);

      expect(prisma.chats.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sent_at: "desc" },
        })
      );
    });

    it("should format dates to ISO strings", async () => {
      const mockMessage = {
        id: mockMessageId,
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Latest",
        is_read: true,
        read_at: new Date("2026-01-05T12:00:00Z"),
        sent_at: new Date("2026-01-05T11:00:00Z"),
        edited_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findFirst as jest.Mock).mockResolvedValue(mockMessage);

      const result = await getLatestMessage(mockMatchId);

      expect(result?.sent_at).toBe("2026-01-05T11:00:00.000Z");
      expect(result?.read_at).toBe("2026-01-05T12:00:00.000Z");
      expect(result?.edited_at).toBeNull();
      expect(result).not.toHaveProperty("deleted_at");
    });
  });
});
