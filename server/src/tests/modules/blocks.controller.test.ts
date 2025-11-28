import { Request, Response, NextFunction } from "express";
import * as BlocksController from "@/modules/blocks/controllers";
import * as BlocksService from "@/modules/blocks/services";

// Mock BlocksService
jest.mock("@/modules/blocks/services", () => ({
  createBlock: jest.fn(),
  unblockUser: jest.fn(),
  getBlockedUsers: jest.fn(),
}));

describe("Blocks Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();
    req = {
      body: {},
      params: {},
      user: { id: "user1-id" },
    } as any;
    res = {
      status: statusMock,
      json: jsonMock,
    } as any;
    jest.clearAllMocks();
  });

  describe("createBlock", () => {
    it("should create a block successfully", async () => {
      req.body = { blockedId: "user2-id" };
      (BlocksService.createBlock as jest.Mock).mockResolvedValue({ id: "block-id" });

      await BlocksController.createBlock(req as Request, res as Response, next);

      expect(BlocksService.createBlock).toHaveBeenCalledWith("user1-id", "user2-id");
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ id: "block-id" });
    });

    it("should return 400 if blockedId is missing", async () => {
      req.body = {};
      await BlocksController.createBlock(req as Request, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "blockedId is required" });
    });

    it("should return 401 if user is not authenticated", async () => {
      req = { body: { blockedId: "user2-id" } } as any; // No user
      await BlocksController.createBlock(req as Request, res as Response, next);
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe("unblockUser", () => {
    it("should unblock successfully", async () => {
      req.params = { blockedId: "user2-id" };
      await BlocksController.unblockUser(req as Request, res as Response, next);
      expect(BlocksService.unblockUser).toHaveBeenCalledWith("user1-id", "user2-id");
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("getBlockedUsers", () => {
    it("should return blocked users", async () => {
      (BlocksService.getBlockedUsers as jest.Mock).mockResolvedValue([]);
      await BlocksController.getBlockedUsers(req as Request, res as Response, next);
      expect(BlocksService.getBlockedUsers).toHaveBeenCalledWith("user1-id");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
  });
});
