# Messaging Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time messaging system for matched users with Socket.IO, message persistence, media uploads, and read receipts.

**Architecture:** Prisma schema stores messages with hard deletes and edit tracking. Socket.IO broadcasts messages to match-specific rooms. Supabase Storage handles media in match folders. Client Zustand store syncs messages with pagination. UI shows chat list sorted by latest message, with read receipt indicators.

**Tech Stack:** Socket.IO (Node.js), Prisma ORM, Supabase Storage, Zustand, React Native, TypeScript, Jest + supertest (backend tests)

**Important Notes:**
- Never include "Generated with Claude Code" or "Co-authored by Claude" footers in commit messages
- Use the `frontend-design` skill for all frontend UI components
- Add loading skeletons to chat list and messages screens (Task 10 and Task 11)
- **Backend API patterns:** Follow the same architecture as existing modules (controllers → services → validators, all error handling via next(error))
- **Client API patterns:** Follow the same patterns as existing API clients (axios interceptors for auth headers, consistent error handling, destructure response objects)

---

## Task 1: Update Prisma Schema for Messages

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_add_message_fields/migration.sql`

**Step 1: Update the chats model with new fields**

Replace the existing `chats` model (lines 98-116) with:

```prisma
model chats {
  id              String    @id @default(cuid())
  match_id        String
  sender_id       String
  message         String
  is_read         Boolean   @default(false)
  read_at         DateTime?
  sent_at         DateTime  @default(now())
  edited_at       DateTime?
  media_url       String?
  message_type    String    @default("TEXT") @db.VarChar(20)
  matches         matches   @relation(fields: [match_id], references: [id], onDelete: Cascade)
  users           User      @relation(fields: [sender_id], references: [id], onDelete: Cascade)

  @@index([match_id], map: "idx_chats_match")
  @@index([sender_id], map: "idx_chats_sender")
  @@index([match_id, sent_at], map: "idx_chats_match_sent")
}
```

**Changes made:**
- Remove `created_at` (use `sent_at` as source of truth)
- Add `edited_at` to track message edits
- Hard delete only (no `deleted_at` field - messages are completely removed when deleted)
- Change `read_at` to nullable (only set when message is read)
- Remove redundant `created_at` index

**Step 2: Create migration**

Run:
```bash
cd server && npx prisma migrate dev --name add_message_edit_and_soft_delete
```

Expected: Migration created successfully, schema.prisma updated

**Step 3: Verify migration**

Run:
```bash
npx prisma db push
```

Expected: Database schema updated without errors

**Step 4: Regenerate Prisma client**

Run:
```bash
npx prisma generate
```

Expected: Client generated in `src/generated/prisma`

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "schema: add edited_at and deleted_at to chats model"
```

---

## Task 2: Create Chat Service Layer

**Files:**
- Create: `server/src/modules/chats/services.ts`
- Create: `server/src/modules/chats/types.ts`

**Step 1: Define types**

Create `server/src/modules/chats/types.ts`:

```typescript
export interface CreateMessageInput {
  match_id: string;
  sender_id: string;
  message: string;
  media_url?: string;
  message_type?: "TEXT" | "IMAGE" | "VIDEO";
}

export interface UpdateMessageInput {
  message?: string;
  is_read?: boolean;
}

export interface ChatHistoryQuery {
  match_id: string;
  limit?: number;
  cursor?: string;
}

export interface MessageResponse {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  edited_at: string | null;
  media_url: string | null;
  message_type: string;
}
```

**Step 2: Create service functions**

Create `server/src/modules/chats/services.ts`:

```typescript
import prisma from "@/lib/prismaClient";
import { CreateMessageInput, UpdateMessageInput, ChatHistoryQuery, MessageResponse } from "./types";

/**
 * Create a new message in a chat
 */
export async function createMessage(input: CreateMessageInput): Promise<MessageResponse> {
  const { match_id, sender_id, message, media_url, message_type = "TEXT" } = input;

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
      deleted_at: true,
      media_url: true,
      message_type: true,
    },
  });

  return formatMessage(chat);
}

/**
 * Fetch chat history with pagination
 */
export async function getChatHistory(query: ChatHistoryQuery): Promise<MessageResponse[]> {
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
export async function markMessagesAsRead(match_id: string, user_id: string): Promise<number> {
  const result = await prisma.chats.updateMany({
    where: {
      match_id,
      sender_id: { not: user_id },
      is_read: false,
      deleted_at: null,
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
export async function deleteMessage(message_id: string, user_id: string): Promise<{ id: string }> {
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
      deleted_at: true,
      media_url: true,
      message_type: true,
    },
  });

  return formatMessage(updated);
}

/**
 * Get the latest message in a match (for unread indicator)
 */
export async function getLatestMessage(match_id: string): Promise<MessageResponse | null> {
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
```

**Step 3: Commit**

```bash
git add server/src/modules/chats/services.ts server/src/modules/chats/types.ts
git commit -m "feat(chats): add service layer with message CRUD operations"
```

---

## Task 3: Create Chat Service Tests

**Files:**
- Create: `server/src/tests/modules/chats.service.test.ts`

**Step 1: Write failing tests**

Create `server/src/tests/modules/chats.service.test.ts`:

```typescript
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
jest.mock("@/lib/prismaClient");

describe("Chat Services", () => {
  const mockUserId1 = "user1";
  const mockUserId2 = "user2";
  const mockMatchId = "match1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMessage", () => {
    it("should create a message for valid match", async () => {
      const mockMatch = { id: mockMatchId, user1: mockUserId1, user2: mockUserId2 };
      const mockMessage = {
        id: "msg1",
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: new Date(),
        edited_at: null,
        deleted_at: null,
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
  });

  describe("markMessagesAsRead", () => {
    it("should mark unread messages as read", async () => {
      (prisma.chats.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await markMessagesAsRead(mockMatchId, mockUserId1);

      expect(result).toBe(3);
      expect(prisma.chats.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            match_id: mockMatchId,
            is_read: false,
          }),
        })
      );
    });
  });

  describe("deleteMessage", () => {
    it("should soft delete a message if sender", async () => {
      const mockMessage = {
        id: "msg1",
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: new Date(),
        edited_at: null,
        deleted_at: new Date(),
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.update as jest.Mock).mockResolvedValue(mockMessage);

      const result = await deleteMessage("msg1", mockUserId1);

      expect(result.deleted_at).not.toBeNull();
    });

    it("should reject if user is not sender", async () => {
      const mockMessage = { id: "msg1", sender_id: mockUserId1 };
      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(deleteMessage("msg1", mockUserId2)).rejects.toThrow(
        "Unauthorized: can only delete own messages"
      );
    });
  });

  describe("editMessage", () => {
    it("should edit message if sender", async () => {
      const mockMessage = {
        id: "msg1",
        match_id: mockMatchId,
        sender_id: mockUserId1,
        message: "Hello",
        is_read: false,
        read_at: null,
        sent_at: new Date(),
        edited_at: new Date(),
        deleted_at: null,
        media_url: null,
        message_type: "TEXT",
      };

      (prisma.chats.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.chats.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        message: "Updated",
      });

      const result = await editMessage("msg1", mockUserId1, { message: "Updated" });

      expect(result.edited_at).not.toBeNull();
    });
  });

  describe("getChatHistory", () => {
    it("should fetch chat history excluding deleted messages", async () => {
      const mockMessages = [
        {
          id: "msg1",
          match_id: mockMatchId,
          sender_id: mockUserId1,
          message: "First",
          is_read: true,
          read_at: new Date(),
          sent_at: new Date("2026-01-01"),
          edited_at: null,
          deleted_at: null,
          media_url: null,
          message_type: "TEXT",
        },
      ];

      (prisma.chats.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await getChatHistory({ match_id: mockMatchId });

      expect(result).toHaveLength(1);
      expect(prisma.chats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deleted_at: null }),
        })
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd server && npm test -- src/tests/modules/chats.service.test.ts
```

Expected: Tests fail with "createMessage is not defined" or similar

**Step 3: Implement minimal code (already done in Task 2)**

The services are already implemented in Task 2.

**Step 4: Run tests to verify they pass**

Run:
```bash
cd server && npm test -- src/tests/modules/chats.service.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add server/src/tests/modules/chats.service.test.ts
git commit -m "test(chats): add service layer unit tests"
```

---

## Task 4: Create Chat API Routes and Controllers

**Files:**
- Create: `server/src/modules/chats/controllers.ts`
- Create: `server/src/modules/chats/routes.ts`
- Create: `server/src/modules/chats/validators.ts`

**Step 1: Create validators**

Create `server/src/modules/chats/validators.ts`:

```typescript
import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateCreateMessage = [
  body("match_id").isString().notEmpty().withMessage("match_id is required"),
  body("message").isString().notEmpty().withMessage("message is required and must be a string"),
  body("media_url").optional().isString().withMessage("media_url must be a string"),
  body("message_type")
    .optional()
    .isIn(["TEXT", "IMAGE", "VIDEO"])
    .withMessage("message_type must be TEXT, IMAGE, or VIDEO"),
];

export const validateGetHistory = [
  param("match_id").isString().notEmpty().withMessage("match_id is required"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1-100"),
  query("cursor").optional().isString().withMessage("cursor must be a string"),
];

export const validateDeleteMessage = [
  param("message_id").isString().notEmpty().withMessage("message_id is required"),
];

export const validateEditMessage = [
  param("message_id").isString().notEmpty().withMessage("message_id is required"),
  body("message").isString().notEmpty().withMessage("message is required"),
];

export const validateMarkRead = [
  param("match_id").isString().notEmpty().withMessage("match_id is required"),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

**Step 2: Create controllers**

Create `server/src/modules/chats/controllers.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import {
  createMessage,
  getChatHistory,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getLatestMessage,
} from "./services";

/**
 * POST /chats/send
 * Create a new message
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { match_id, message, media_url, message_type } = req.body;

    const result = await createMessage({
      match_id,
      sender_id: userId,
      message,
      media_url,
      message_type,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chats/:match_id/history
 * Fetch chat history with pagination
 */
export async function getChatHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { match_id } = req.params;
    const { limit, cursor } = req.query;

    const messages = await getChatHistory({
      match_id,
      limit: limit ? parseInt(limit as string) : 50,
      cursor: cursor as string | undefined,
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /chats/:match_id/read
 * Mark all messages in a match as read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { match_id } = req.params;

    const count = await markMessagesAsRead(match_id, userId);

    res.json({ updated: count });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /chats/:message_id
 * Soft delete a message
 */
export async function deleteMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { message_id } = req.params;

    const result = await deleteMessage(message_id, userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /chats/:message_id
 * Edit a message
 */
export async function editMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { message_id } = req.params;
    const { message } = req.body;

    const result = await editMessage(message_id, userId, { message });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chats/:match_id/latest
 * Get latest message in a match (for unread indicator)
 */
export async function getLatestMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { match_id } = req.params;

    const message = await getLatestMessage(match_id);

    if (!message) {
      return res.status(404).json({ error: "No messages found" });
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
}
```

**Step 3: Create routes**

Create `server/src/modules/chats/routes.ts`:

```typescript
import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import {
  sendMessage,
  getChatHistoryHandler,
  markAsRead,
  deleteMessageHandler,
  editMessageHandler,
  getLatestMessageHandler,
} from "./controllers";
import {
  validateCreateMessage,
  validateGetHistory,
  validateDeleteMessage,
  validateEditMessage,
  validateMarkRead,
  handleValidationErrors,
} from "./validators";

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Send a message
router.post("/send", validateCreateMessage, handleValidationErrors, sendMessage);

// Get chat history with pagination
router.get("/:match_id/history", validateGetHistory, handleValidationErrors, getChatHistoryHandler);

// Get latest message (for unread indicator)
router.get("/:match_id/latest", getLatestMessageHandler);

// Mark messages as read
router.put("/:match_id/read", validateMarkRead, handleValidationErrors, markAsRead);

// Edit a message
router.patch("/:message_id", validateEditMessage, handleValidationErrors, editMessageHandler);

// Delete a message
router.delete("/:message_id", validateDeleteMessage, handleValidationErrors, deleteMessageHandler);

export default router;
```

**Step 4: Register routes in app.ts**

Modify `server/src/app.ts` - add this line in the routes section:

```typescript
import chatsRoutes from "@/modules/chats/routes";

app.use("/api/chats", chatsRoutes);
```

**Step 5: Commit**

```bash
git add server/src/modules/chats/controllers.ts server/src/modules/chats/routes.ts server/src/modules/chats/validators.ts server/src/app.ts
git commit -m "feat(chats): add API routes, controllers, and validators"
```

---

## Task 5: Set Up Supabase Storage for Chat Media

**Files:**
- Create: `server/src/lib/supabaseStorage.ts`
- Create: `server/src/modules/chats/storage.ts`

**Step 1: Create Supabase storage client**

Create `server/src/lib/supabaseStorage.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**Step 2: Create chat media storage handler**

Create `server/src/modules/chats/storage.ts`:

```typescript
import { supabase } from "@/lib/supabaseStorage";
import * as fs from "fs";
import * as path from "path";

const CHAT_BUCKET = "chat-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload media file to Supabase storage in match-specific folder
 * Path: chat-media/match/{matchId}/{timestamp}-{filename}
 */
export async function uploadChatMedia(
  matchId: string,
  filePath: string,
  fileName: string
): Promise<string> {
  try {
    // Validate file exists and size
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const fileSize = fs.statSync(filePath).size;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Generate unique path
    const timestamp = Date.now();
    const storagePath = `match/${matchId}/${timestamp}-${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: getMimeType(fileName),
        cacheControl: "3600",
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(CHAT_BUCKET)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (err) {
    throw new Error(`Failed to upload chat media: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Delete media file from Supabase storage
 */
export async function deleteChatMedia(fileUrl: string): Promise<void> {
  try {
    // Extract path from public URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts.slice(-3).join("/"); // match/matchId/filename

    const { error } = await supabase.storage
      .from(CHAT_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  } catch (err) {
    throw new Error(`Failed to delete chat media: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
```

**Step 3: Add upload endpoint to controllers**

Modify `server/src/modules/chats/controllers.ts` - add this function:

```typescript
import { uploadChatMedia } from "./storage";

/**
 * POST /chats/:match_id/upload
 * Upload media file for chat
 * Expects multipart form with "file" field
 */
export async function uploadMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const { match_id } = req.params;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Verify user is in match
    const match = await prisma.matches.findUnique({
      where: { id: match_id },
    });

    if (!match || (match.user1 !== userId && match.user2 !== userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const publicUrl = await uploadChatMedia(match_id, file.path, file.originalname);

    res.json({ media_url: publicUrl });
  } catch (error) {
    next(error);
  }
}
```

Add to `server/src/modules/chats/routes.ts`:

```typescript
import multer from "multer";

const upload = multer({ dest: "/tmp" });

// Upload media (requires multipart)
router.post("/:match_id/upload", upload.single("file"), uploadMedia);
```

**Step 4: Commit**

```bash
git add server/src/lib/supabaseStorage.ts server/src/modules/chats/storage.ts server/src/modules/chats/controllers.ts server/src/modules/chats/routes.ts
git commit -m "feat(chats): add Supabase storage for chat media"
```

---

## Task 6: Set Up Socket.IO Server

**Files:**
- Create: `server/src/websocket/socketManager.ts`
- Create: `server/src/websocket/handlers/messageHandlers.ts`
- Modify: `server/src/server.ts`

**Step 1: Create Socket.IO manager**

Create `server/src/websocket/socketManager.ts`:

```typescript
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { markMessagesAsRead } from "@/modules/chats/services";

interface SocketUser {
  userId: string;
  matchIds: string[];
}

const userSockets = new Map<string, SocketUser>();

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Middleware: authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    // Verify token and attach userId to socket
    // In production, verify JWT token properly
    try {
      const userId = verifySocketToken(token);
      socket.data.userId = userId;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Track user connection
    userSockets.set(socket.id, {
      userId,
      matchIds: [],
    });

    // Handle joining a match room
    socket.on("join_match", async (matchId: string) => {
      socket.join(`match_${matchId}`);

      const user = userSockets.get(socket.id);
      if (user && !user.matchIds.includes(matchId)) {
        user.matchIds.push(matchId);
      }

      console.log(`User ${userId} joined match ${matchId}`);

      // Notify other user in match that this user is online
      socket.to(`match_${matchId}`).emit("user_online", { userId });
    });

    // Handle leaving a match room
    socket.on("leave_match", (matchId: string) => {
      socket.leave(`match_${matchId}`);

      const user = userSockets.get(socket.id);
      if (user) {
        user.matchIds = user.matchIds.filter((id) => id !== matchId);
      }

      console.log(`User ${userId} left match ${matchId}`);

      // Notify other user that this user is offline
      socket.to(`match_${matchId}`).emit("user_offline", { userId });
    });

    // Handle incoming message
    socket.on("message_send", async (data) => {
      const { matchId, message, media_url, message_type } = data;

      // Broadcast to match room
      io.to(`match_${matchId}`).emit("message_received", {
        id: Date.now().toString(), // Placeholder, will be replaced by DB id
        matchId,
        userId,
        message,
        media_url,
        message_type: message_type || "TEXT",
        sent_at: new Date().toISOString(),
      });
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { matchId } = data;
      socket.to(`match_${matchId}`).emit("user_typing", { userId });
    });

    // Handle stop typing
    socket.on("stop_typing", (data) => {
      const { matchId } = data;
      socket.to(`match_${matchId}`).emit("user_stop_typing", { userId });
    });

    // Handle mark as read
    socket.on("mark_read", async (data) => {
      const { matchId } = data;
      try {
        await markMessagesAsRead(matchId, userId);
        socket.to(`match_${matchId}`).emit("messages_read", { userId });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const user = userSockets.get(socket.id);
      if (user) {
        user.matchIds.forEach((matchId) => {
          socket.to(`match_${matchId}`).emit("user_offline", { userId });
        });
      }
      userSockets.delete(socket.id);
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}

/**
 * Verify socket token (stub - implement JWT verification)
 */
function verifySocketToken(token: string): string {
  // TODO: Implement proper JWT verification
  // For now, assume token format: "Bearer <userId>"
  const parts = token.split(" ");
  if (parts.length !== 2) {
    throw new Error("Invalid token format");
  }
  return parts[1];
}

export { userSockets };
```

**Step 2: Modify server.ts to initialize Socket.IO**

Modify `server/src/server.ts`:

```typescript
import { createServer } from "http";
import { initializeSocket } from "@/websocket/socketManager";

const httpServer = createServer(app);
initializeSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Commit**

```bash
git add server/src/websocket/socketManager.ts server/src/server.ts
git commit -m "feat(websocket): initialize Socket.IO with match room handling"
```

---

## Task 7: Create Zustand Chat Store

**Files:**
- Create: `client/store/chatStore.ts`
- Create: `client/types/chat.ts`

**Step 1: Define chat types**

Create `client/types/chat.ts`:

```typescript
export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  edited_at: string | null;
  media_url: string | null;
  message_type: "TEXT" | "IMAGE" | "VIDEO";
}

export interface ChatConversation {
  match_id: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  userTyping: boolean;
  otherUserOnline: boolean;
}

export interface ChatState {
  conversations: Record<string, ChatConversation>;
  currentMatchId: string | null;

  // Actions
  setCurrentMatch: (matchId: string) => void;
  addMessage: (matchId: string, message: ChatMessage) => void;
  deleteMessage: (matchId: string, messageId: string) => void;
  editMessage: (matchId: string, messageId: string, newText: string) => void;
  setMessages: (matchId: string, messages: ChatMessage[]) => void;
  setLoading: (matchId: string, loading: boolean) => void;
  setError: (matchId: string, error: string | null) => void;
  setHasMore: (matchId: string, hasMore: boolean) => void;
  setCursor: (matchId: string, cursor: string | null) => void;
  setUserTyping: (matchId: string, typing: boolean) => void;
  setOtherUserOnline: (matchId: string, online: boolean) => void;
  markAsRead: (matchId: string) => void;
  reset: () => void;
}
```

**Step 2: Create Zustand store**

Create `client/store/chatStore.ts`:

```typescript
import { create } from "zustand";
import { ChatState, ChatMessage, ChatConversation } from "@/types/chat";

const defaultConversation: ChatConversation = {
  match_id: "",
  messages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  cursor: null,
  userTyping: false,
  otherUserOnline: false,
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: {},
  currentMatchId: null,

  setCurrentMatch: (matchId: string) => {
    set((state) => {
      if (!state.conversations[matchId]) {
        state.conversations[matchId] = {
          ...defaultConversation,
          match_id: matchId,
        };
      }
      return { currentMatchId: matchId };
    });
  },

  addMessage: (matchId: string, message: ChatMessage) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: [...conversation.messages, message],
          },
        },
      };
    });
  },

  deleteMessage: (matchId: string, messageId: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.filter((msg) => msg.id !== messageId),
          },
        },
      };
    });
  },

  editMessage: (matchId: string, messageId: string, newText: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    message: newText,
                    edited_at: new Date().toISOString(),
                  }
                : msg
            ),
          },
        },
      };
    });
  },

  setMessages: (matchId: string, messages: ChatMessage[]) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          messages,
        },
      },
    }));
  },

  setLoading: (matchId: string, loading: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          isLoading: loading,
        },
      },
    }));
  },

  setError: (matchId: string, error: string | null) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          error,
        },
      },
    }));
  },

  setHasMore: (matchId: string, hasMore: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          hasMore,
        },
      },
    }));
  },

  setCursor: (matchId: string, cursor: string | null) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          cursor,
        },
      },
    }));
  },

  setUserTyping: (matchId: string, typing: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          userTyping: typing,
        },
      },
    }));
  },

  setOtherUserOnline: (matchId: string, online: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          otherUserOnline: online,
        },
      },
    }));
  },

  markAsRead: (matchId: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.map((msg) =>
              msg.is_read ? msg : { ...msg, is_read: true, read_at: new Date().toISOString() }
            ),
          },
        },
      };
    });
  },

  reset: () => {
    set({ conversations: {}, currentMatchId: null });
  },
}));
```

**Step 3: Commit**

```bash
git add client/types/chat.ts client/store/chatStore.ts
git commit -m "feat(chat-store): add Zustand store for chat state management"
```

---

## Task 8: Create Chat API Client

**Files:**
- Create: `client/api/chats.ts`

**Step 1: Create API client**

Create `client/api/chats.ts`:

```typescript
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { ChatMessage } from "@/types/chat";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

const chatAPI = axios.create({
  baseURL: `${API_URL}/chats`,
});

// Add auth token to requests
chatAPI.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Send a message
 */
export async function sendMessage(
  matchId: string,
  message: string,
  mediaUrl?: string,
  messageType?: "TEXT" | "IMAGE" | "VIDEO"
): Promise<ChatMessage> {
  const { data } = await chatAPI.post("/send", {
    match_id: matchId,
    message,
    media_url: mediaUrl,
    message_type: messageType || "TEXT",
  });
  return data;
}

/**
 * Get chat history with pagination
 */
export async function getChatHistory(
  matchId: string,
  limit?: number,
  cursor?: string
): Promise<ChatMessage[]> {
  const { data } = await chatAPI.get(`/${matchId}/history`, {
    params: { limit, cursor },
  });
  return data;
}

/**
 * Get latest message (for unread indicator)
 */
export async function getLatestMessage(matchId: string): Promise<ChatMessage | null> {
  try {
    const { data } = await chatAPI.get(`/${matchId}/latest`);
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(matchId: string): Promise<number> {
  const { data } = await chatAPI.put(`/${matchId}/read`);
  return data.updated;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<ChatMessage> {
  const { data } = await chatAPI.delete(`/${messageId}`);
  return data;
}

/**
 * Edit a message
 */
export async function editMessage(messageId: string, newMessage: string): Promise<ChatMessage> {
  const { data } = await chatAPI.patch(`/${messageId}`, {
    message: newMessage,
  });
  return data;
}

/**
 * Upload media to a match
 */
export async function uploadMedia(
  matchId: string,
  file: File
): Promise<{ media_url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await chatAPI.post(`/${matchId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export default chatAPI;
```

**Step 2: Commit**

```bash
git add client/api/chats.ts
git commit -m "feat(api): add chat API client with message operations"
```

---

## Task 9: Create Socket.IO Client Integration

**Files:**
- Create: `client/utils/socketClient.ts`

**Step 1: Create Socket.IO client**

Create `client/utils/socketClient.ts`:

```typescript
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { ChatMessage } from "@/types/chat";
import * as chatAPI from "@/api/chats";

let socket: Socket | null = null;

export function initializeSocket() {
  const { token } = useAuthStore.getState();

  if (!token) {
    console.error("No auth token available");
    return;
  }

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

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
      deleted_at: null,
      media_url,
      message_type,
    };
    useChatStore.getState().addMessage(matchId, chatMessage);
  });

  // User typing
  socket.on("user_typing", (data: any) => {
    const { userId } = data;
    useChatStore.getState().setUserTyping(data.matchId, true);
  });

  // User stop typing
  socket.on("user_stop_typing", (data: any) => {
    useChatStore.getState().setUserTyping(data.matchId, false);
  });

  // Messages read
  socket.on("messages_read", (data: any) => {
    const { matchId } = data;
    useChatStore.getState().markAsRead(matchId);
  });

  // User online
  socket.on("user_online", (data: any) => {
    const { userId } = data;
    // Find match and update online status
    useChatStore.getState().setOtherUserOnline(data.matchId, true);
  });

  // User offline
  socket.on("user_offline", (data: any) => {
    useChatStore.getState().setOtherUserOnline(data.matchId, false);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
}

/**
 * Join a match room
 */
export function joinMatch(matchId: string) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("join_match", matchId);
}

/**
 * Leave a match room
 */
export function leaveMatch(matchId: string) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("leave_match", matchId);
}

/**
 * Send message via socket
 */
export function sendMessageSocket(
  matchId: string,
  message: string,
  mediaUrl?: string,
  messageType?: "TEXT" | "IMAGE" | "VIDEO"
) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("message_send", {
    matchId,
    message,
    media_url: mediaUrl,
    message_type: messageType || "TEXT",
  });
}

/**
 * Emit typing indicator
 */
export function emitTyping(matchId: string) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("typing", { matchId });
}

/**
 * Emit stop typing
 */
export function emitStopTyping(matchId: string) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("stop_typing", { matchId });
}

/**
 * Mark messages as read via socket
 */
export function markReadSocket(matchId: string) {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit("mark_read", { matchId });
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
```

**Step 2: Commit**

```bash
git add client/utils/socketClient.ts
git commit -m "feat(socket): add Socket.IO client integration for real-time messaging"
```

---

## Task 10: Create Chat List Screen with Loading Skeleton

**Files:**
- Design with frontend-design skill: `client/app/(app)/(tabs)/chats.tsx`
- Create: `client/components/ChatListItem.tsx`
- Use: `client/components/shared/SkeletonLoader.tsx` (existing, configure rows=6 for chat items)
- Create: `client/store/matchStore.ts` (update if exists)

**Step 1: Use frontend-design skill to design chat list UI**

Use the `frontend-design` skill to create the chats page with:
- Title/header styling
- Chat list item layout (avatar, name, message preview, unread indicator, read receipt)
- Loading state using `SkeletonLoader` component configured with 6 rows for chat items
- Empty state message when no matches

This ensures high-quality, distinctive UI design.

**Step 2: Create matches store (if not exists) to track matches and last messages**

Create or update `client/store/matchStore.ts`:

```typescript
import { create } from "zustand";

export interface MatchWithLastMessage {
  id: string;
  user1: string;
  user2: string;
  matched_at: string;
  lastMessage?: {
    text: string;
    sentAt: string;
    isRead: boolean;
    senderIsMe: boolean;
  };
  otherUserName?: string;
  otherUserImage?: string;
}

interface MatchState {
  matches: MatchWithLastMessage[];
  setMatches: (matches: MatchWithLastMessage[]) => void;
  updateLastMessage: (matchId: string, message: string, sentAt: string, isRead: boolean, senderIsMe: boolean) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  updateLastMessage: (matchId, message, sentAt, isRead, senderIsMe) => {
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              lastMessage: {
                text: message,
                sentAt,
                isRead,
                senderIsMe,
              },
            }
          : match
      ),
    }));
  },
}));
```

**Step 2: Create ChatListItem component**

Create `client/components/ChatListItem.tsx`:

```typescript
import React from "react";
import { Pressable, StyleSheet, View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { MatchWithLastMessage } from "@/store/matchStore";

interface ChatListItemProps {
  match: MatchWithLastMessage;
}

export function ChatListItem({ match }: ChatListItemProps) {
  const router = useRouter();
  const { lastMessage, otherUserName, otherUserImage } = match;

  const handlePress = () => {
    router.push({
      pathname: "/chat-detail",
      params: { matchId: match.id, userName: otherUserName || "User" },
    });
  };

  const isUnread = lastMessage && !lastMessage.isRead && !lastMessage.senderIsMe;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, isUnread && styles.unread]}
      accessible={true}
      accessibilityLabel={`Chat with ${otherUserName}`}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: otherUserImage || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {otherUserName || "User"}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage?.senderIsMe ? "You: " : ""} {lastMessage?.text || "No messages yet"}
        </Text>
      </View>

      {isUnread && <View style={styles.unreadIndicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: "center",
  },
  unread: {
    backgroundColor: theme.colors.unreadBg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
});
```

**Step 3: Create chat list screen**

Create `client/app/(app)/(tabs)/chats.tsx`:

```typescript
import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useMatchStore, MatchWithLastMessage } from "@/store/matchStore";
import { ChatListItem } from "@/components/ChatListItem";
import * as matchAPI from "@/api/matches";
import * as chatAPI from "@/api/chats";

export default function ChatsScreen() {
  const userId = useAuthStore((state) => state.user?.id);
  const { matches, setMatches, updateLastMessage } = useMatchStore();
  const [loading, setLoading] = useState(false);

  // Fetch matches
  const { data: matchesData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["matches", userId],
    queryFn: async () => {
      if (!userId) return [];
      // Assumes matchAPI.getMatches exists
      return matchAPI.getMatches();
    },
    enabled: !!userId,
  });

  // Load matches and fetch last message for each
  useEffect(() => {
    const loadMatches = async () => {
      if (!matchesData) return;

      setLoading(true);
      try {
        const matchesWithMessages = await Promise.all(
          matchesData.map(async (match) => {
            const lastMessage = await chatAPI.getLatestMessage(match.id);
            const otherUserId = match.user1 === userId ? match.user2 : match.user1;

            return {
              ...match,
              lastMessage: lastMessage
                ? {
                    text: lastMessage.message,
                    sentAt: lastMessage.sent_at,
                    isRead: lastMessage.is_read,
                    senderIsMe: lastMessage.sender_id === userId,
                  }
                : undefined,
              otherUserId,
            };
          })
        );

        // Sort by latest message
        matchesWithMessages.sort((a, b) => {
          const aTime = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt).getTime() : 0;
          const bTime = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt).getTime() : 0;
          return bTime - aTime;
        });

        setMatches(matchesWithMessages as MatchWithLastMessage[]);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [matchesData, userId, setMatches]);

  if (isLoadingMatches || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No matches yet. Start swiping!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatListItem match={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
```

**Step 4: Commit**

```bash
git add client/app/\(app\)/\(tabs\)/chats.tsx client/components/ChatListItem.tsx client/store/matchStore.ts
git commit -m "feat(ui): add chat list screen with matches sorted by latest message"
```

---

## Task 11: Create Chat Detail Screen with Message Skeleton

**Files:**
- Design with frontend-design skill: `client/app/(app)/chat-detail.tsx`
- Create: `client/components/MessageBubble.tsx`
- Create: `client/components/MessageInput.tsx`
- Use: `client/components/shared/SkeletonLoader.tsx` (configure for message placeholders on load)

**Step 1: Use frontend-design skill to design chat detail UI**

Use the `frontend-design` skill to create the chat detail page with:
- Message list with message bubbles (left/right aligned based on sender)
- Loading state using `SkeletonLoader` component configured with staggered message bubble placeholders
- Message input bar with image upload button
- Read receipt indicators
- Typing indicator placeholder
- Deleted message placeholder styling
- Edited message label

This ensures high-quality, distinctive UI design.

**Step 2: Create MessageBubble component**

Create `client/components/MessageBubble.tsx`:

```typescript
import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { theme } from "@/constants/theme";
import { ChatMessage } from "@/types/chat";
import { useAuthStore } from "@/store/authStore";

interface MessageBubbleProps {
  message: ChatMessage;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
}

export function MessageBubble({ message, onDelete, onEdit }: MessageBubbleProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const isOwnMessage = message.sender_id === userId;
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      <Pressable
        onLongPress={() => setShowMenu(!showMenu)}
        style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}
      >
        {message.media_url && (
          <Image source={{ uri: message.media_url }} style={styles.media} />
        )}
        <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}>
          {message.message}
        </Text>
        {message.edited_at && (
          <Text style={styles.editedText}>(edited)</Text>
        )}
      </Pressable>

      <View style={styles.meta}>
        <Text style={styles.timestamp}>
          {new Date(message.sent_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {isOwnMessage && message.is_read && (
          <Text style={styles.readReceipt}>✓✓</Text>
        )}
      </View>

      {showMenu && isOwnMessage && (
        <View style={styles.menu}>
          <Pressable onPress={() => onDelete?.(message.id)} style={styles.menuItem}>
            <Text style={styles.menuText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  ownContainer: {
    alignItems: "flex-end",
  },
  otherContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: "80%",
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
  },
  otherBubble: {
    backgroundColor: theme.colors.messageOtherBg,
  },
  text: {
    fontSize: 16,
  },
  ownText: {
    color: "#fff",
  },
  otherText: {
    color: theme.colors.text,
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  editedText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  meta: {
    flexDirection: "row",
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  readReceipt: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  menu: {
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    overflow: "hidden",
  },
  menuItem: {
    padding: 8,
  },
  menuText: {
    color: theme.colors.error,
    fontSize: 14,
  },
});
```

**Step 2: Create MessageInput component**

Create `client/components/MessageInput.tsx`:

```typescript
import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "@/constants/theme";

interface MessageInputProps {
  onSend: (text: string, mediaUrl?: string) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Emit typing
    if (!typingTimer && newText.length > 0) {
      onTyping?.();
    }

    // Reset typing timer
    if (typingTimer) clearTimeout(typingTimer);

    const timer = setTimeout(() => {
      onStopTyping?.();
      setTypingTimer(null);
    }, 3000);

    setTypingTimer(timer);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedMedia) return;

    setLoading(true);
    try {
      await onSend(text, selectedMedia || undefined);
      setText("");
      setSelectedMedia(null);
      onStopTyping?.();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {selectedMedia && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedMedia }} style={styles.preview} />
          <Pressable
            onPress={() => setSelectedMedia(null)}
            style={styles.removeButton}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      <View style={styles.container}>
        <Pressable onPress={handlePickImage} disabled={disabled || loading}>
          <Ionicons
            name="image"
            size={24}
            color={disabled ? theme.colors.textSecondary : theme.colors.primary}
          />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={handleTextChange}
          multiline
          disabled={disabled || loading}
          editable={!disabled && !loading}
        />

        <Pressable
          onPress={handleSend}
          disabled={disabled || loading || (!text.trim() && !selectedMedia)}
          style={styles.sendButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="send" size={20} color={theme.colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    padding: 8,
  },
  previewContainer: {
    position: "relative",
    margin: 8,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
});
```

**Step 3: Create chat detail screen**

Create `client/app/(app)/chat-detail.tsx`:

```typescript
import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator, Text, SafeAreaView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { theme } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import * as chatAPI from "@/api/chats";
import {
  initializeSocket,
  joinMatch,
  leaveMatch,
  sendMessageSocket,
  markReadSocket,
  disconnectSocket,
  emitTyping,
  emitStopTyping,
} from "@/utils/socketClient";

export default function ChatDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId, userName } = route.params as { matchId: string; userName: string };
  const userId = useAuthStore((state) => state.user?.id);

  const {
    conversations,
    setCurrentMatch,
    setMessages,
    setLoading,
    addMessage,
    deleteMessage: deleteMessageStore,
  } = useChatStore();

  const conversation = conversations[matchId];
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize Socket.IO and fetch initial messages
  useEffect(() => {
    // Set as current match
    setCurrentMatch(matchId);

    // Initialize Socket.IO
    initializeSocket();

    // Join match room
    joinMatch(matchId);

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(matchId, true);
      try {
        const messages = await chatAPI.getChatHistory(matchId, 50);
        setMessages(matchId, messages);

        // Mark as read
        await chatAPI.markMessagesAsRead(matchId);
        markReadSocket(matchId);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(matchId, false);
      }
    };

    fetchMessages();

    // Set navigation title
    navigation.setOptions({ title: userName });

    // Cleanup on unmount
    return () => {
      leaveMatch(matchId);
    };
  }, [matchId]);

  const handleSendMessage = async (text: string, mediaUrl?: string) => {
    try {
      // Send via API (for persistence)
      const message = await chatAPI.sendMessage(matchId, text, mediaUrl);

      // Emit via Socket.IO (for real-time delivery)
      sendMessageSocket(matchId, text, mediaUrl);

      // Add to store
      addMessage(matchId, message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatAPI.deleteMessage(messageId);
      deleteMessageStore(matchId, messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleLoadMore = async () => {
    if (!conversation || !conversation.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const olderMessages = await chatAPI.getChatHistory(
        matchId,
        50,
        conversation.cursor
      );

      if (olderMessages.length > 0) {
        setMessages(matchId, [...olderMessages, ...conversation.messages]);
      } else {
        // No more messages
        // setHasMore(matchId, false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!conversation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conversation.messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onDelete={handleDeleteMessage}
          />
        )}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={theme.colors.primary} /> : null
        }
      />

      <MessageInput
        onSend={handleSendMessage}
        onTyping={() => emitTyping(matchId)}
        onStopTyping={() => emitStopTyping(matchId)}
        disabled={conversation.isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
```

**Step 4: Commit**

```bash
git add client/components/MessageBubble.tsx client/components/MessageInput.tsx client/app/\(app\)/chat-detail.tsx
git commit -m "feat(ui): add chat detail screen with message input and display"
```

---

## Task 12: Final Integration and Testing

**Files:**
- Modify: `client/app.json` (add Socket.IO client config)
- Modify: `server/package.json` (ensure dependencies)
- Modify: `client/package.json` (ensure dependencies)

**Step 1: Verify dependencies**

Backend - run from `server/`:
```bash
npm install socket.io multer
npm list socket.io
```

Frontend - run from `client/`:
```bash
npm install socket.io-client
npm list socket.io-client
```

**Step 2: Run backend tests**

```bash
cd server && npm test
```

Expected: All tests pass, including chat service tests

**Step 3: Lint frontend and backend**

Backend:
```bash
cd server && npm run lint
```

Frontend:
```bash
cd client && npm run lint
```

Fix any linting errors.

**Step 4: Manual test checklist**

- [ ] Backend: Start server and verify Socket.IO connection
- [ ] Frontend: Open chat list, see matches sorted by latest message
- [ ] Frontend: Click a match, see chat history loaded
- [ ] Frontend: Send a text message, see it appear in real-time
- [ ] Frontend: Send a message with image, see media uploaded
- [ ] Frontend: Mark messages as read, see read receipt
- [ ] Frontend: Delete a message, see "Message deleted"
- [ ] Frontend: Leave chat and rejoin, see history persists
- [ ] Frontend: Open multiple chats, verify isolation

**Step 5: Final commit**

```bash
git add server/package.json client/package.json
git commit -m "chore: add Socket.IO and multer dependencies"
```

---

## Verification Steps

**To verify the full messaging feature:**

1. **Database**: Check that chat schema has all fields (edited_at, deleted_at, indexes)
2. **Services**: Run `npm test` and confirm all chat service tests pass
3. **API Routes**: Test POST /api/chats/send, GET /api/chats/:match_id/history, etc. manually
4. **Storage**: Verify Supabase bucket `chat-media` exists and can receive uploads
5. **Socket.IO**: Check server logs show "User joined match" and "User connected" messages
6. **Client Store**: Verify Zustand store updates on message send/delete
7. **UI**: Test chat list loads, chat detail screen works, messages display correctly

---

## Summary

This plan implements a complete messaging system with:
- Persistent message storage with soft deletes and edits
- Real-time messaging via Socket.IO
- Media uploads to Supabase Storage
- Read receipts and online status
- Pagination for chat history
- Full client-server integration with Zustand and Socket.IO

All components are tested, linted, and follow project conventions.
