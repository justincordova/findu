import { Request, Response } from "express";
import * as LikesController from "@/modules/likes/controllers";
import * as LikesService from "@/modules/likes/services";

// Mock LikesService
jest.mock("@/modules/likes/services", () => ({
  createLike: jest.fn(),
}));

describe("Likes Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      body: {},
      user: { id: "user1-id" },
    } as any;
    res = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it("should create a like successfully", async () => {
    req.body = {
      from_user: "user1-id",
      to_user: "user2-id",
      is_superlike: false,
    };

    const mockResult = {
      matched: false,
      matchId: undefined,
      like: { id: "like-id" }
    };

    (LikesService.createLike as jest.Mock).mockResolvedValue(mockResult);

    await LikesController.createLike(req as Request, res as Response);

    expect(LikesService.createLike).toHaveBeenCalledWith({
      from_user: "user1-id",
      to_user: "user2-id",
      is_superlike: false,
    });
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      like: mockResult.like,
      matched: mockResult.matched,
      matchId: mockResult.matchId,
    });
  });

  it("should return 400 if validation fails (missing to_user)", async () => {
    req.body = {
      // Missing to_user
      is_superlike: false,
    };

    (LikesService.createLike as jest.Mock).mockRejectedValue(new Error("Both from_user and to_user are required"));

    await LikesController.createLike(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Both from_user and to_user are required" });
  });

  it("should handle service errors", async () => {
    req.body = {
      to_user: "user2-id",
    };

    (LikesService.createLike as jest.Mock).mockRejectedValue(new Error("Database error"));

    await LikesController.createLike(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
  });
});
