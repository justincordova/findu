import * as DiscoverService from "@/modules/discover/services";
import { Profile } from "@/types/Profile";
import { ProfileWithScore } from "@/types/Discover";
import prisma from "@/lib/prismaClient";
import { subYears } from 'date-fns';

// Mock prisma
jest.mock("@/lib/prismaClient", () => ({
  profiles: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  likes: {
    findMany: jest.fn(),
  },
  matches: {
    findMany: jest.fn(),
  },
  blocks: {
    findMany: jest.fn(),
  },
}));

// Mock date-fns to control time in tests
jest.mock('date-fns', () => ({
  differenceInYears: jest.fn(),
  subYears: jest.fn(),
  addDays: jest.fn(),
}));

const mockToday = new Date('2024-01-15T12:00:00Z');
const mockBirthdate = new Date('2000-06-15T12:00:00Z'); // 23 years old

const sampleUserProfile: Profile = {
  user_id: "user1-id",
  name: "John Doe",
  avatar_url: "https://example.com/avatar1.jpg",
  birthdate: mockBirthdate,
  gender: "male",
  pronouns: "he/him",
  bio: "Love hiking and music!",
  university: "Stanford University",
  university_year: 3,
  major: "Computer Science",
  grad_year: 2025,
  interests: ["hiking", "music", "coding"],
  intent: "serious_relationship",
  gender_preference: ["female"],
  sexual_orientation: "straight",
  min_age: 20,
  max_age: 30,
  spotify_url: "https://spotify.com/user/johndoe",
  instagram_url: "https://instagram.com/john_doe",
  photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleCandidateProfile: Profile = {
  user_id: "candidate1-id",
  name: "Jane Smith",
  avatar_url: "https://example.com/avatar2.jpg",
  birthdate: subYears(mockToday, 25), // 25 years old
  gender: "female",
  pronouns: "she/her",
  bio: "Bookworm who loves the outdoors!",
  university: "Stanford University",
  university_year: 2,
  major: "Psychology",
  grad_year: 2024,
  interests: ["hiking", "music", "reading"],
  intent: "serious_relationship",
  gender_preference: ["male"],
  sexual_orientation: "straight",
  min_age: 20,
  max_age: 30,
  spotify_url: "https://spotify.com/user/janesmith",
  instagram_url: "https://instagram.com/jane_smith",
  photos: ["https://example.com/photo3.jpg"],
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleCandidateProfile2: Profile = {
  ...sampleCandidateProfile,
  user_id: "candidate2-id",
  name: "Alex Johnson",
  bio: "Love sports and movies!",
  major: "Business",
  interests: ["sports", "movies"],
  intent: "casual_dating",
  sexual_orientation: "bisexual",
  spotify_url: undefined,
  instagram_url: "https://instagram.com/alex_johnson",
  photos: ["https://example.com/photo4.jpg", "https://example.com/photo5.jpg"],
};

describe("Discover API happy path cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
    (require('date-fns').subYears as jest.Mock).mockImplementation((date, years) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate()));
    (require('date-fns').addDays as jest.Mock).mockImplementation((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should calculate age correctly", () => {
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(25);
    
    const age = DiscoverService.calculateAge(mockBirthdate);
    
    expect(age).toBe(25);
    expect(require('date-fns').differenceInYears).toHaveBeenCalledWith(expect.any(Date), mockBirthdate);
  });

  it("should return shared interests between two arrays", () => {
    const interests1 = ["hiking", "music", "coding"];
    const interests2 = ["hiking", "music", "reading"];

    const result = DiscoverService.getSharedInterests(interests1, interests2);

    expect(result).toEqual(["hiking", "music"]);
  });

  it("should return true if candidate age is within range", () => {
    const result = DiscoverService.isWithinAgePreference(23, 25, 20, 30);
    expect(result).toBe(true);
  });

  it("should calculate Jaccard similarity correctly", () => {
    const interests1 = ["hiking", "music", "coding"];
    const interests2 = ["hiking", "music", "reading"];
    // Shared: 2, Total unique: 4, Score: 2/4 = 0.5

    const score = DiscoverService.calculateSharedInterestsScore(interests1, interests2);

    expect(score).toBe(0.5);
  });

  it("should return 1.0 for identical intents", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("serious_relationship", "serious_relationship");
    expect(score).toBe(1.0);
  });

  it("should return correct score for different intents", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("serious_relationship", "casual_dating");
    expect(score).toBe(0.3);
  });

  it("should return 1.0 for matching orientations with compatible genders", () => {
    const score = DiscoverService.calculateOrientationCompatibilityScore(
      "straight", "straight", "male", "female", ["female"], ["male"]
    );
    expect(score).toBe(1.0);
  });

  it("should return 0.9 for cross-compatible orientations", () => {
    const score = DiscoverService.calculateOrientationCompatibilityScore(
      "bisexual", "straight", "male", "female", ["female"], ["male"]
    );
    expect(score).toBe(0.9);
  });

  it("should calculate overall compatibility score correctly", () => {
    const score = DiscoverService.calculateCompatibilityScore(sampleUserProfile, sampleCandidateProfile);
    
    // Should be > 0 since they have shared interests and compatible orientations
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("should return eligible candidates successfully", async () => {
    // Mock database calls
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile]);

    const result = await DiscoverService.getEligibleCandidates("user1-id", sampleUserProfile);

    expect(result).toEqual([sampleCandidateProfile]);
    expect(prisma.profiles.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        user_id: { notIn: ["user1-id"] },
        university: "Stanford University",
        gender: { in: ["female"] },
        birthdate: expect.any(Object),
        min_age: { lte: 23 },
        max_age: { gte: 23 },
        gender_preference: { 
          has: "male",
          isEmpty: false
        },
        interests: { isEmpty: false }
      }),
      take: 200,
    });
  });

  it("should exclude already liked, matched, and blocked users", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([{ to_user: "liked-user-id" }]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([{ user1: "user1-id", user2: "matched-user-id" }]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([{ blocker_id: "user1-id", blocked_id: "blocked-user-id" }]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([]);

    await DiscoverService.getEligibleCandidates("user1-id", sampleUserProfile);

    expect(prisma.profiles.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        user_id: { notIn: expect.arrayContaining(["user1-id", "liked-user-id", "matched-user-id", "blocked-user-id"]) }
      }),
      take: 200,
    });
  });

  it("should return discover profiles with compatibility scores", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile, sampleCandidateProfile2]);

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('compatibilityScore');
    expect(result[0]).toHaveProperty('user_id');
    expect(typeof result[0].compatibilityScore).toBe('number');
  });

  it("should apply pagination correctly", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile, sampleCandidateProfile2]);

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 1, 1);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBeDefined();
  });

  it("should return profiles sorted by compatibility score", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    
    // Create candidates with different compatibility levels
    const highCompatibilityCandidate = {
      ...sampleCandidateProfile,
      user_id: "high-compat-id",
      interests: ["hiking", "music", "coding"], // All shared interests
      intent: "serious_relationship", // Same intent
    };
    
    const lowCompatibilityCandidate = {
      ...sampleCandidateProfile,
      user_id: "low-compat-id",
      interests: ["completely", "different"], // No shared interests
      intent: "hookups", // Different intent
    };

    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([
      lowCompatibilityCandidate,
      highCompatibilityCandidate
    ]);

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    expect(result).toHaveLength(2);
    // Higher compatibility should come first (after randomization within tiers)
    expect(result.find(p => p.user_id === "high-compat-id")?.compatibilityScore)
      .toBeGreaterThan(result.find(p => p.user_id === "low-compat-id")?.compatibilityScore || 0);
  });

  it("should validate user exists for refresh feed", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue({ user_id: "user1-id" });

    await expect(DiscoverService.refreshDiscoverFeed("user1-id")).resolves.toBeUndefined();

    expect(prisma.profiles.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user1-id" },
      select: { user_id: true }
    });
  });

  it("should maintain score-based ordering within tiers", () => {
    const candidates: ProfileWithScore[] = [
      { ...sampleCandidateProfile, user_id: "low1", compatibilityScore: 15 },
      { ...sampleCandidateProfile, user_id: "high1", compatibilityScore: 85 },
      { ...sampleCandidateProfile, user_id: "mid1", compatibilityScore: 50 },
      { ...sampleCandidateProfile, user_id: "high2", compatibilityScore: 90 },
      { ...sampleCandidateProfile, user_id: "low2", compatibilityScore: 10 },
    ];

    const result = DiscoverService.rankCandidatesWithRandomization(candidates);

    expect(result).toHaveLength(5);
    
    // High scores (81-100) should come first
    const highScoreCandidates = result.filter(c => c.compatibilityScore >= 81);
    expect(highScoreCandidates).toHaveLength(2);
    
    // Low scores (0-20) should come last
    const lowScoreCandidates = result.slice(-2);
    expect(lowScoreCandidates.every(c => c.compatibilityScore <= 20)).toBe(true);
  });
});

describe("Discover API edge & failure cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return empty array if no shared interests", () => {
    const interests1 = ["hiking", "music"];
    const interests2 = ["sports", "movies"];

    const result = DiscoverService.getSharedInterests(interests1, interests2);

    expect(result).toEqual([]);
  });

  it("should return empty array if either interest array is empty or null", () => {
    expect(DiscoverService.getSharedInterests([], ["music"])).toEqual([]);
    expect(DiscoverService.getSharedInterests(["music"], [])).toEqual([]);
    expect(DiscoverService.getSharedInterests(null as any, ["music"])).toEqual([]);
  });

  it("should return false if candidate age is outside range", () => {
    expect(DiscoverService.isWithinAgePreference(23, 19, 20, 30)).toBe(false);
    expect(DiscoverService.isWithinAgePreference(23, 31, 20, 30)).toBe(false);
  });

  it("should return true for edge cases (exact min/max)", () => {
    expect(DiscoverService.isWithinAgePreference(23, 20, 20, 30)).toBe(true);
    expect(DiscoverService.isWithinAgePreference(23, 30, 20, 30)).toBe(true);
  });

  it("should return 0 for no shared interests in score calculation", () => {
    const interests1 = ["hiking", "music"];
    const interests2 = ["sports", "movies"];

    const score = DiscoverService.calculateSharedInterestsScore(interests1, interests2);

    expect(score).toBe(0);
  });

  it("should return 0 for empty arrays in score calculation", () => {
    expect(DiscoverService.calculateSharedInterestsScore([], ["music"])).toBe(0);
    expect(DiscoverService.calculateSharedInterestsScore(["music"], [])).toBe(0);
  });

  it("should return 0.3 for missing intents", () => {
    expect(DiscoverService.calculateIntentCompatibilityScore("", "serious_relationship")).toBe(0.3);
    expect(DiscoverService.calculateIntentCompatibilityScore("serious_relationship", "")).toBe(0.3);
  });

  it("should return 0.5 for unknown intent combinations", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("unknown_intent" as any, "serious_relationship");
    expect(score).toBe(0.5);
  });

  it("should return 0.1 if gender preferences don't match", () => {
    const score = DiscoverService.calculateOrientationCompatibilityScore(
      "straight", "straight", "male", "female", ["male"], ["female"]
    );
    expect(score).toBe(0.1);
  });

  it("should return 0.5 for missing orientations", () => {
    const score = DiscoverService.calculateOrientationCompatibilityScore(
      "", "straight", "male", "female", ["female"], ["male"]
    );
    expect(score).toBe(0.5);
  });

  it("should return lower score for incompatible profiles", () => {
    const incompatibleProfile = {
      ...sampleCandidateProfile,
      interests: ["completely", "different", "interests"],
      intent: "hookups",
      gender_preference: ["non-binary"], // Doesn't include user's gender
    };

    const score = DiscoverService.calculateCompatibilityScore(sampleUserProfile, incompatibleProfile);
    expect(score).toBeLessThan(50); // Should be low due to incompatibilities
  });

  it("should throw error if user has no gender preferences", async () => {
    const profileWithoutPrefs = { ...sampleUserProfile, gender_preference: [] };

    await expect(
      DiscoverService.getEligibleCandidates("user1-id", profileWithoutPrefs)
    ).rejects.toThrow("User must have at least one gender preference set");
  });

  it("should throw error if user ID is missing in getDiscoverProfiles", async () => {
    await expect(
      DiscoverService.getDiscoverProfiles("", 10, 0)
    ).rejects.toThrow("User ID is required");
  });

  it("should throw error if user profile not found", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      DiscoverService.getDiscoverProfiles("nonexistent-user", 10, 0)
    ).rejects.toThrow("User profile not found");
  });

  it("should throw error if user ID is missing in refreshDiscoverFeed", async () => {
    await expect(
      DiscoverService.refreshDiscoverFeed("")
    ).rejects.toThrow("User ID is required");
  });

  it("should throw error if user not found in refresh", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      DiscoverService.refreshDiscoverFeed("nonexistent-user")
    ).rejects.toThrow("User not found");
  });

  it("should handle profiles with null/undefined interests gracefully", () => {
    const profileWithNullInterests = { ...sampleUserProfile, interests: null as any };
    const profileWithEmptyInterests = { ...sampleCandidateProfile, interests: [] };

    const score = DiscoverService.calculateSharedInterestsScore(
      profileWithNullInterests.interests, 
      profileWithEmptyInterests.interests
    );

    expect(score).toBe(0);
  });

  it("should handle missing orientation data gracefully", () => {
    const score = DiscoverService.calculateOrientationCompatibilityScore(
      null as any, null as any, "male", "female", ["female"], ["male"]
    );

    expect(score).toBe(0.5); // Neutral score
  });

  it("should handle empty candidate list", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([]);

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    expect(result).toEqual([]);
  });
});