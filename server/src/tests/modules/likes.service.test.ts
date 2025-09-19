import * as LikesService from "@/modules/likes/services";
import { Like } from "@/types/Like";
import { Profile } from "@/types/Profile";
import prisma from "@/lib/prismaClient";

// Mock prisma
jest.mock("@/lib/prismaClient", () => ({
  profiles: { findUnique: jest.fn() },
  likes: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  blocks: { findFirst: jest.fn() },
  matches: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
}));

const fromUser = "user1";
const toUser = "user2";

const sampleLike: Like = { from_user: fromUser, to_user: toUser };

const mockProfile = (user_id: string): Profile => ({
  user_id,
  name: "Mock User",
  avatar_url: "https://example.com/avatar.jpg",
  birthdate: new Date("2000-01-01"),
  gender: "male",
  pronouns: "he/him",
  bio: "Bio",
  university_id: "uni-123", // updated for new schema
  campus_id: null,
  university_year: 3,
  major: "Computer Science",
  grad_year: 2025,
  interests: ["coding"],
  intent: "serious_relationship",
  gender_preference: ["female"],
  sexual_orientation: "straight",
  min_age: 18,
  max_age: 30,
  photos: [],
  created_at: new Date(),
  updated_at: new Date(),
});

describe("Likes API happy path cases", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create a like successfully without creating a match", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(mockProfile(fromUser));
    (prisma.blocks.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb({
        likes: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(sampleLike), count: jest.fn().mockResolvedValue(0) },
        matches: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "match-id" }) },
      })
    );

    const result = await LikesService.createLike(sampleLike);
    expect(result.like).toEqual(sampleLike);
    expect(result.matched).toBe(false);
    expect(result.matchId).toBeNull();
  });

  it("should create a like and a match if reciprocal like exists", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(mockProfile(fromUser));
    (prisma.blocks.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb({
        likes: {
          findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(sampleLike),
          create: jest.fn().mockResolvedValue(sampleLike),
          count: jest.fn().mockResolvedValue(0),
        },
        matches: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "match-id" }) },
      })
    );

    const result = await LikesService.createLike(sampleLike);
    expect(result.like).toEqual(sampleLike);
    expect(result.matched).toBe(true);
    expect(result.matchId).toBe("match-id");
  });

  it("should fetch all sent likes for a user", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([sampleLike]);
    const result = await LikesService.getSentLikes(fromUser);
    expect(result).toEqual([sampleLike]);
  });

  it("should fetch all received likes for a user", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([sampleLike]);
    const result = await LikesService.getReceivedLikes(toUser);
    expect(result).toEqual([sampleLike]);
  });

  it("should remove a like successfully", async () => {
    (prisma.likes.findFirst as jest.Mock).mockResolvedValue(sampleLike);
    (prisma.likes.delete as jest.Mock).mockResolvedValue(sampleLike);

    const result = await LikesService.removeLike("like-id", fromUser);
    expect(result).toEqual(sampleLike);
  });

  it("should check if two users are matched", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue({ id: "match-id" });
    const matched = await LikesService.areUsersMatched(fromUser, toUser);
    expect(matched).toBe(true);
  });

  it("should check if user can send superlike under limit", async () => {
    (prisma.likes.count as jest.Mock).mockResolvedValue(3);
    const canSend = await LikesService.canSendSuperlike(fromUser);
    expect(canSend).toBe(true);
  });
});

describe("Likes API edge & failure cases", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw error when user tries to like themselves", async () => {
    await expect(LikesService.createLike({ from_user: "same-user", to_user: "same-user" }))
      .rejects.toThrow("Users cannot like themselves");
  });

  it("should throw error when user profiles are not found", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await expect(LikesService.createLike(sampleLike)).rejects.toThrow("User profiles not found");
  });

  it("should throw error when liking a blocked user", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(mockProfile(fromUser));
    (prisma.blocks.findFirst as jest.Mock).mockResolvedValue({});
    await expect(LikesService.createLike(sampleLike)).rejects.toThrow("Cannot like blocked user");
  });

  it("should throw error when removing a like not owned by user", async () => {
    (prisma.likes.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(LikesService.removeLike("like-id", fromUser)).rejects.toThrow("Like not found or unauthorized");
  });

  it("should return false if superlike limit reached", async () => {
    (prisma.likes.count as jest.Mock).mockResolvedValue(5);
    const canSend = await LikesService.canSendSuperlike(fromUser);
    expect(canSend).toBe(false);
  });
});
