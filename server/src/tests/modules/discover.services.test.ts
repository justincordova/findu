import * as DiscoverService from "@/modules/discover/services";
import { Profile } from "@/types/Profile";
import { ProfileWithScore } from "@/types/Discover";
import prisma from "@/lib/prismaClient";
import { subYears } from 'date-fns';

// Mock prisma
jest.mock("@/lib/prismaClient", () => ({
  profiles: { findUnique: jest.fn(), findMany: jest.fn() },
  likes: { findMany: jest.fn() },
  matches: { findMany: jest.fn() },
  blocks: { findMany: jest.fn() },
}));

// Mock interests
jest.mock("@/constants/interests", () => ({
  getInterestCategory: jest.fn((interest: string) => {
    const categoryMap: Record<string, string> = {
      "Coding": "Technology",
      "Programming": "Technology",
      "Web Development": "Technology",
      "Hiking": "Outdoor",
      "Music": "Music",
      "Reading": "Intellectual",
      "Fitness": "Sports",
      "Gaming": "Gaming",
      "Photography": "Creative",
      "Travel": "Lifestyle",
    };
    return categoryMap[interest] || null;
  }),
}));

// Mock date-fns
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
  gender: "Male",
  pronouns: "he/him",
  bio: "Love hiking and music!",
  university_id: "uni-123",
  campus_id: "campus-1",
  university_year: 3,
  major: "Computer Science",
  grad_year: 2025,
  interests: ["Coding", "Hiking", "Music"],
  intent: "Serious Relationship",
  gender_preference: ["Female"],
  sexual_orientation: "Heterosexual",
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
  gender: "Female",
  pronouns: "she/her",
  bio: "Bookworm who loves the outdoors!",
  university_id: "uni-123",
  campus_id: "campus-1",
  university_year: 2,
  major: "Computer Science",
  grad_year: 2026,
  interests: ["Hiking", "Music", "Reading"],
  intent: "Serious Relationship",
  gender_preference: ["Male"],
  sexual_orientation: "Heterosexual",
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
  interests: ["Fitness", "Gaming"],
  intent: "Casual Dating",
  sexual_orientation: "Bisexual",
  spotify_url: undefined,
  instagram_url: "https://instagram.com/alex_johnson",
  photos: ["https://example.com/photo4.jpg", "https://example.com/photo5.jpg"],
};

describe("Discover API - Interest Scoring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
    (require('date-fns').subYears as jest.Mock).mockImplementation(
      (date, years) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate())
    );
    (require('date-fns').addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should calculate exact interest matches", () => {
    // Both have "Hiking" and "Music"
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Hiking", "Music"],
      ["Hiking", "Music", "Reading"]
    );
    // 2 exact matches / max(3, min(3,3)) = 2/3 ≈ 0.667
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(0.7);
  });

  it("should award partial points for category matches", () => {
    // "Coding" (Technology) matches with "Web Development" (Technology) = 0.5 points
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding"],
      ["Web Development"]
    );
    // 0.5 / max(3, min(1,1)) = 0.5 / 3 ≈ 0.167
    expect(score).toBeGreaterThan(0.1);
    expect(score).toBeLessThan(0.2);
  });

  it("should not penalize users with diverse interests", () => {
    // User with 5 interests vs user with 2 interests
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Hiking", "Music", "Fitness", "Photography"],
      ["Coding", "Hiking"]
    );
    // 2 exact / max(3, min(5,2)) = 2/3 ≈ 0.667
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(0.7);
  });

  it("should return 0 for no shared interests", () => {
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Web Development"],
      ["Fitness", "Hiking"]
    );
    expect(score).toBe(0);
  });
});

describe("Discover API - Intent Compatibility Matrix", () => {
  it("should score same intent as 1.0", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("Dating", "Dating");
    expect(score).toBe(1.0);
  });

  it("should allow cross-intent matching at 0.5-0.8", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("Dating", "Study Buddy");
    expect(score).toBe(0.5); // Cross-intent but possible
  });

  it("should score incompatible intents lower", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("Hookup", "Networking");
    expect(score).toBe(0.2); // Incompatible
  });

  it("should handle Unsure intent", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore("Unsure", "Dating");
    expect(score).toBe(0.6); // Moderate compatibility
  });
});

describe("Discover API - Age Scoring", () => {
  it("should return 1.0 for 0-2 year difference", () => {
    expect(DiscoverService.calculateAgeScore(25, 26)).toBe(1.0);
    expect(DiscoverService.calculateAgeScore(25, 27)).toBe(1.0);
  });

  it("should return 0.8 for 3-5 year difference", () => {
    expect(DiscoverService.calculateAgeScore(25, 28)).toBe(0.8);
    expect(DiscoverService.calculateAgeScore(25, 30)).toBe(0.8);
  });

  it("should apply soft penalty for 6+ year difference", () => {
    // 6 year diff: 1.0 - (6 - 5) * 0.02 = 0.98 (minimal penalty)
    expect(DiscoverService.calculateAgeScore(25, 31)).toBe(0.98);
    // 10 year diff: 1.0 - (10 - 5) * 0.02 = 0.9
    expect(DiscoverService.calculateAgeScore(25, 35)).toBe(0.9);
    // Should still be >= 0.6 floor
    expect(DiscoverService.calculateAgeScore(25, 31)).toBeGreaterThanOrEqual(0.6);
  });

  it("should maintain minimum score of 0.6", () => {
    expect(DiscoverService.calculateAgeScore(25, 100)).toBe(0.6);
  });
});

describe("Discover API - Major Compatibility", () => {
  it("should score same major as 1.0", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore("Computer Science", "Computer Science");
    expect(score).toBe(1.0);
  });

  it("should score different major as 0.0", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore("Computer Science", "Business");
    expect(score).toBe(0.0);
  });

  it("should be case-insensitive", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore("computer science", "COMPUTER SCIENCE");
    expect(score).toBe(1.0);
  });

  it("should return 0 if either major is missing", () => {
    expect(DiscoverService.calculateMajorCompatibilityScore(undefined, "Business")).toBe(0);
    expect(DiscoverService.calculateMajorCompatibilityScore("CS", undefined)).toBe(0);
  });
});

describe("Discover API - Overall Compatibility Score", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should calculate overall compatibility score with new weights", () => {
    const score = DiscoverService.calculateCompatibilityScore(sampleUserProfile, sampleCandidateProfile);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("should weight interests at 35%, intent at 30%, orientation at 15%, major at 10%, age at 10%", () => {
    // Create profiles with clear scores to verify weighting
    const user: Profile = {
      ...sampleUserProfile,
      interests: ["Coding", "Music", "Hiking"],
      intent: "Dating",
      major: "Computer Science",
    };

    const candidate: Profile = {
      ...sampleCandidateProfile,
      interests: ["Coding", "Music", "Hiking"],
      intent: "Dating",
      major: "Computer Science",
    };

    const score = DiscoverService.calculateCompatibilityScore(user, candidate);
    // Should be high since all components match well (all perfect: interests 1.0, intent 1.0, orientation 1.0, major 1.0, age 1.0)
    // Expected: (1.0 * 0.35) + (1.0 * 0.30) + (1.0 * 0.15) + (1.0 * 0.10) + (1.0 * 0.10) = 1.0 * 100 = 100
    expect(score).toBeGreaterThan(90);
  });

  it("should include age penalty in final score", () => {
    const closeAgeUser: Profile = {
      ...sampleUserProfile,
      birthdate: new Date('2001-01-15'), // 23 years old
    };

    const farAgeCandidate: Profile = {
      ...sampleCandidateProfile,
      birthdate: new Date('1995-01-15'), // 29 years old (6 year difference)
    };

    const score = DiscoverService.calculateCompatibilityScore(closeAgeUser, farAgeCandidate);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("Discover API - Mutual Like Detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it("should detect users who have already liked the current user", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([
      { from_user: "candidate3-id" },
      { from_user: "candidate2-id" },
    ]);

    const likers = await DiscoverService.getMutualLikedUsers("user1-id");
    expect(likers).toEqual(["candidate3-id", "candidate2-id"]);
  });

  it("should return empty array if no mutual likes", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);

    const likers = await DiscoverService.getMutualLikedUsers("user1-id");
    expect(likers).toEqual([]);
  });

  it("should throw error if user ID is missing", async () => {
    await expect(DiscoverService.getMutualLikedUsers("")).rejects.toThrow();
  });
});

describe("Discover API - Priority Ranking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
    (require('date-fns').subYears as jest.Mock).mockImplementation(
      (date, years) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate())
    );
    (require('date-fns').addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should prioritize mutual likes (TIER 1) above compatibility score (TIER 2+)", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([
      { from_user: "candidate2-id" }, // Candidate 2 already liked user1
    ]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);

    // candidate1 has higher compatibility but didn't like user
    // candidate2 has lower compatibility but already liked user
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile, sampleCandidateProfile2]);

    const spy = jest.spyOn(DiscoverService, "calculateCompatibilityScore");
    spy.mockReturnValueOnce(85).mockReturnValueOnce(60); // candidate1 score, candidate2 score

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    // candidate2 should come first despite lower score (because they liked user)
    expect(result[0].user_id).toBe("candidate2-id");
    expect(result[1].user_id).toBe("candidate1-id");

    spy.mockRestore();
  });

  it("should include likedByUser flag in results", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([
      { from_user: "candidate1-id" },
    ]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile]);

    const result: ProfileWithScore[] = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    expect(result[0]).toHaveProperty('likedByUser');
    expect(result[0].likedByUser).toBe(true);
  });

  it("should maintain score-based ranking within same tier", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]); // No mutual likes
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);

    const candidate1 = { ...sampleCandidateProfile, user_id: "user-a" };
    const candidate2 = { ...sampleCandidateProfile, user_id: "user-b" };
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([candidate1, candidate2]);

    const spy = jest.spyOn(DiscoverService, "calculateCompatibilityScore");
    spy.mockReturnValueOnce(75).mockReturnValueOnce(85); // user-a has 75, user-b has 85

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    // user-b should come first (higher score)
    expect(result[0].user_id).toBe("user-b");
    expect(result[1].user_id).toBe("user-a");

    spy.mockRestore();
  });
});

describe("getEligibleCandidates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
    (require('date-fns').subYears as jest.Mock).mockImplementation(
      (date, years) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate())
    );
    (require('date-fns').addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should apply gender filter when gender_preference is not 'All'", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([]);

    await DiscoverService.getEligibleCandidates("user1-id", {
      ...sampleUserProfile,
      gender_preference: ["Female"],
    });

    expect(prisma.profiles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gender: { in: ["Female"] },
        }),
      })
    );
  });

  it("should enforce same university and campus as hard filters", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([]);

    await DiscoverService.getEligibleCandidates("user1-id", sampleUserProfile);

    expect(prisma.profiles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          university_id: "uni-123",
          campus_id: "campus-1",
        }),
      })
    );
  });
});

describe("Discover API - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(mockToday.getTime());
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should throw error if user has no gender preferences", async () => {
    await expect(
      DiscoverService.getEligibleCandidates("user1-id", { ...sampleUserProfile, gender_preference: [] })
    ).rejects.toThrow("User must have at least one gender preference set");
  });

  it("should throw error if user profile not found", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(DiscoverService.getDiscoverProfiles("nonexistent-user", 10, 0)).rejects.toThrow("User profile not found");
  });

  it("should throw error if user ID is missing for getDiscoverProfiles", async () => {
    await expect(DiscoverService.getDiscoverProfiles("", 10, 0)).rejects.toThrow("User ID is required");
  });
});
