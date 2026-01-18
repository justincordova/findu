import * as BlocksService from "@/modules/blocks/services";
import prisma from "@/lib/prismaClient";

// Mock prisma
jest.mock("@/lib/prismaClient", () => ({
  blocks: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
}));

const blockerId = "user1";
const blockedId = "user2";

describe("Blocks Service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createBlock", () => {
    it("should create a block successfully", async () => {
      (prisma.blocks.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.blocks.create as jest.Mock).mockResolvedValue({
        id: "block-id",
        blocker_id: blockerId,
        blocked_id: blockedId,
      });

      const result = await BlocksService.createBlock(blockerId, blockedId);
      expect(result).toEqual({
        id: "block-id",
        blocker_id: blockerId,
        blocked_id: blockedId,
      });
      expect(prisma.blocks.create).toHaveBeenCalledWith({
        data: { blocker_id: blockerId, blocked_id: blockedId },
      });
    });

    it("should return existing block if already blocked", async () => {
      const existingBlock = {
        id: "existing-block",
        blocker_id: blockerId,
        blocked_id: blockedId,
      };
      (prisma.blocks.findUnique as jest.Mock).mockResolvedValue(existingBlock);

      const result = await BlocksService.createBlock(blockerId, blockedId);
      expect(result).toEqual(existingBlock);
      expect(prisma.blocks.create).not.toHaveBeenCalled();
    });

    it("should throw error if blocking self", async () => {
      await expect(BlocksService.createBlock(blockerId, blockerId)).rejects.toThrow(
        "Cannot block yourself"
      );
    });
  });

  describe("unblockUser", () => {
    it("should unblock a user successfully", async () => {
      (prisma.blocks.delete as jest.Mock).mockResolvedValue({
        id: "block-id",
        blocker_id: blockerId,
        blocked_id: blockedId,
      });

      await BlocksService.unblockUser(blockerId, blockedId);
      expect(prisma.blocks.delete).toHaveBeenCalledWith({
        where: {
          blocker_id_blocked_id: {
            blocker_id: blockerId,
            blocked_id: blockedId,
          },
        },
      });
    });
  });

  describe("getBlockedUsers", () => {
    it("should return list of blocked users", async () => {
      const mockBlockedUsers = [
        {
          id: "block-1",
          blocker_id: blockerId,
          blocked_id: blockedId,
          users_blocks_blocked_idTousers: {
            profiles: {
              name: "Blocked User",
              avatar_url: "avatar.jpg",
            },
          },
        },
      ];
      (prisma.blocks.findMany as jest.Mock).mockResolvedValue(mockBlockedUsers);

      const result = await BlocksService.getBlockedUsers(blockerId);
      expect(result).toEqual(mockBlockedUsers);
      expect(prisma.blocks.findMany).toHaveBeenCalledWith({
        where: { blocker_id: blockerId },
        include: {
          users_blocks_blocked_idTousers: {
            include: {
              profiles: {
                select: {
                  name: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });
    });
  });
});
