import * as MatchesService from "@/modules/matches/services";
import { Match } from "@/types/Match";
import prisma from "@/lib/prismaClient";

// Mock prisma
jest.mock("@/lib/prismaClient", () => ({
  matches: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

const user1 = "user1-id";
const user2 = "user2-id";
const matchSample: Match = {
  id: "match-id",
  user1,
  user2,
  matched_at: new Date(),
};

describe("Matches API happy path cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a match successfully", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.matches.create as jest.Mock).mockResolvedValue(matchSample);

    const result = await MatchesService.createMatch(user1, user2);

    expect(prisma.matches.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user1,
        user2,
        matched_at: expect.any(Date),
      }),
      select: { id: true, user1: true, user2: true, matched_at: true },
    });

    expect(result).toEqual(matchSample);
  });

  it("should fetch matches for a user", async () => {
    const mockMatchWithProfile = {
      ...matchSample,
      users_matches_user1Tousers: {
        profiles: { name: "User 1", avatar_url: "url1" }
      },
      users_matches_user2Tousers: {
        profiles: { name: "User 2", avatar_url: "url2" }
      }
    };

    (prisma.matches.findMany as jest.Mock).mockResolvedValue([mockMatchWithProfile]);

    const result = await MatchesService.getMatchesForUser(user1);

    expect(prisma.matches.findMany).toHaveBeenCalledWith({
      where: { OR: [{ user1 }, { user2: user1 }] },
      include: {
        users_matches_user1Tousers: {
          include: {
            profiles: {
              select: { name: true, avatar_url: true }
            }
          }
        },
        users_matches_user2Tousers: {
          include: {
            profiles: {
              select: { name: true, avatar_url: true }
            }
          }
        }
      },
      orderBy: { matched_at: "desc" },
    });

    expect(result).toEqual([{
      id: matchSample.id,
      user1: matchSample.user1,
      user2: matchSample.user2,
      matched_at: matchSample.matched_at,
      otherUser: {
        id: user2,
        name: "User 2",
        avatar_url: "url2"
      }
    }]);
  });

  it("should check if users are matched", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue(matchSample);

    const result = await MatchesService.areUsersMatched(user1, user2);

    expect(result).toBe(true);
    expect(prisma.matches.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { user1, user2 },
          { user1: user2, user2: user1 },
        ],
      },
    });
  });

  it("should delete a match successfully", async () => {
    (prisma.matches.delete as jest.Mock).mockResolvedValue(undefined);

    await MatchesService.deleteMatch(matchSample.id);

    expect(prisma.matches.delete).toHaveBeenCalledWith({ where: { id: matchSample.id } });
  });

  it("should return mutual match info", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue(matchSample);

    const result = await MatchesService.getMutualMatch(user1, user2);

    expect(result).toEqual(matchSample);
  });
});

describe("Matches API edge & failure cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw if creating a match with invalid IDs", async () => {
    await expect(MatchesService.createMatch(user1, user1)).rejects.toThrow(
      "Valid user IDs required and users cannot match themselves"
    );

    await expect(MatchesService.createMatch("", user2)).rejects.toThrow(
      "Valid user IDs required and users cannot match themselves"
    );
  });

  it("should return existing match if match already exists", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue(matchSample);

    const result = await MatchesService.createMatch(user1, user2);

    expect(result).toEqual(matchSample);
    expect(prisma.matches.create).not.toHaveBeenCalled();
  });

  it("should return false for areUsersMatched with invalid IDs", async () => {
    const result = await MatchesService.areUsersMatched(user1, user1);
    expect(result).toBe(false);
  });

  it("should throw if deleting match without ID", async () => {
    await expect(MatchesService.deleteMatch("")).rejects.toThrow("Match ID is required");
  });

  it("should return null for getMutualMatch with invalid IDs", async () => {
    const result = await MatchesService.getMutualMatch(user1, user1);
    expect(result).toBeNull();
  });

  it("should return null for getMutualMatch if no match exists", async () => {
    (prisma.matches.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await MatchesService.getMutualMatch(user1, user2);
    expect(result).toBeNull();
  });
});
