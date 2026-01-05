import prisma from "@/lib/prismaClient";
import {
  CreateMessageInput,
  UpdateMessageInput,
  ChatHistoryQuery,
  MessageResponse,
} from "./types";

/**
 * Create a new message in a chat
 */
export async function createMessage(
  input: CreateMessageInput
): Promise<MessageResponse> {
  const { match_id, sender_id, message, media_url, message_type = "TEXT" } =
    input;

  // Verify sender is part of the match
  const match = await prisma.matches.findUnique({
    where: { id: match_id },
  });

  if (!match || (match.user1 !== sender_id && match.user2 !== sender_id)) {
    throw new Error("User not part of this match");
  }

  const chat = await prisma.chats.create({
    data: {
      match_id,
      sender_id,
      message,
      media_url,
      message_type,
    },
    select: {
      id: true,
      match_id: true,
      sender_id: true,
      message: true,
      is_read: true,
      read_at: true,
      sent_at: true,
      edited_at: true,
      media_url: true,
      message_type: true,
    },
  });

  return formatMessage(chat);
}

/**
 * Fetch chat history with pagination (hard deletes only - deleted messages are completely removed)
 */
export async function getChatHistory(
  query: ChatHistoryQuery
): Promise<MessageResponse[]> {
  const { match_id, limit = 50, cursor } = query;

  const messages = await prisma.chats.findMany({
    where: {
      match_id,
    },
    select: {
      id: true,
      match_id: true,
      sender_id: true,
      message: true,
      is_read: true,
      read_at: true,
      sent_at: true,
      edited_at: true,
      media_url: true,
      message_type: true,
    },
    orderBy: { sent_at: "desc" },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  return messages.map(formatMessage).reverse();
}

/**
 * Mark messages as read in a match
 */
export async function markMessagesAsRead(
  match_id: string,
  user_id: string
): Promise<number> {
  const result = await prisma.chats.updateMany({
    where: {
      match_id,
      sender_id: { not: user_id },
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return result.count;
}

/**
 * Hard delete a message (only sender can delete)
 */
export async function deleteMessage(
  message_id: string,
  user_id: string
): Promise<{ id: string }> {
  const message = await prisma.chats.findUnique({
    where: { id: message_id },
  });

  if (!message || message.sender_id !== user_id) {
    throw new Error("Unauthorized: can only delete own messages");
  }

  await prisma.chats.delete({
    where: { id: message_id },
  });

  return { id: message_id };
}

/**
 * Edit a message (only sender can edit)
 */
export async function editMessage(
  message_id: string,
  user_id: string,
  input: UpdateMessageInput
): Promise<MessageResponse> {
  const message = await prisma.chats.findUnique({
    where: { id: message_id },
  });

  if (!message || message.sender_id !== user_id) {
    throw new Error("Unauthorized: can only edit own messages");
  }

  const updated = await prisma.chats.update({
    where: { id: message_id },
    data: {
      message: input.message || message.message,
      edited_at: new Date(),
    },
    select: {
      id: true,
      match_id: true,
      sender_id: true,
      message: true,
      is_read: true,
      read_at: true,
      sent_at: true,
      edited_at: true,
      media_url: true,
      message_type: true,
    },
  });

  return formatMessage(updated);
}

/**
 * Get the latest message in a match (for unread indicator)
 */
export async function getLatestMessage(
  match_id: string
): Promise<MessageResponse | null> {
  const message = await prisma.chats.findFirst({
    where: {
      match_id,
    },
    select: {
      id: true,
      match_id: true,
      sender_id: true,
      message: true,
      is_read: true,
      read_at: true,
      sent_at: true,
      edited_at: true,
      media_url: true,
      message_type: true,
    },
    orderBy: { sent_at: "desc" },
  });

  return message ? formatMessage(message) : null;
}

/**
 * Format message for response (convert dates to ISO strings)
 */
function formatMessage(msg: any): MessageResponse {
  return {
    ...msg,
    sent_at: msg.sent_at.toISOString(),
    read_at: msg.read_at?.toISOString() || null,
    edited_at: msg.edited_at?.toISOString() || null,
  };
}
