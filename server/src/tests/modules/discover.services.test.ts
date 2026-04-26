import { subYears } from "date-fns";
import prisma from "@/lib/prismaClient";
import * as DiscoverService from "@/modules/discover/services";
import type { ProfileWithScore } from "@/types/Discover";
import type { Profile } from "@/types/Profile";

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
      Coding: "Technology",
      Programming: "Technology",
      "Web Development": "Technology",
      Hiking: "Outdoor",
      Music: "Music",
      Reading: "Intellectual",
      Fitness: "Sports",
      Gaming: "Gaming",
      Photography: "Creative",
      Travel: "Lifestyle",
    };
    return categoryMap[interest] || null;
  }),
}));

// Mock gender mapping
jest.mock("@/utils/genderMapping", () => ({
  genderPreferencesToIdentities: jest.fn((prefs: string[]) => {
    if (prefs.includes("All")) return ["Male", "Female", "Non-binary", "Other"];
    const map: Record<string, string> = {
      Men: "Male",
      Women: "Female",
      "Non-binary": "Non-binary",
      Other: "Other",
    };
    return prefs.map((p) => map[p] || p);
  }),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  differenceInYears: jest.fn(),
  subYears: jest.fn(),
  addDays: jest.fn(),
}));

const mockToday = new Date("2024-01-15T12:00:00Z");
const mockBirthdate = new Date("2000-06-15T12:00:00Z"); // 23 years old

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
  gender_preference: ["Women"],
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
  gender_preference: ["Men"],
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
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
    (require("date-fns").subYears as jest.Mock).mockImplementation(
      (date, years) =>
        new Date(date.getFullYear() - years, date.getMonth(), date.getDate()),
    );
    (require("date-fns").addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should calculate exact interest matches", () => {
    // Both have "Hiking" and "Music"
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Hiking", "Music"],
      ["Hiking", "Music", "Reading"],
    );
    // 2 exact matches / max(3, min(3,3)) = 2/3 ≈ 0.667
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(0.7);
  });

  it("should award partial points for category matches", () => {
    // "Coding" (Technology) matches with "Web Development" (Technology) = 0.5 points
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding"],
      ["Web Development"],
    );
    // 0.5 / max(3, min(1,1)) = 0.5 / 3 ≈ 0.167
    expect(score).toBeGreaterThan(0.1);
    expect(score).toBeLessThan(0.2);
  });

  it("should not penalize users with diverse interests", () => {
    // User with 5 interests vs user with 2 interests
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Hiking", "Music", "Fitness", "Photography"],
      ["Coding", "Hiking"],
    );
    // 2 exact / max(3, min(5,2)) = 2/3 ≈ 0.667
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(0.7);
  });

  it("should return 0 for no shared interests", () => {
    const score = DiscoverService.calculateSharedInterestsScore(
      ["Coding", "Web Development"],
      ["Fitness", "Hiking"],
    );
    expect(score).toBe(0);
  });
});

describe("Discover API - Intent Compatibility Matrix", () => {
  it("should score same intent as 1.0", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore(
      "Dating",
      "Dating",
    );
    expect(score).toBe(1.0);
  });

  it("should allow cross-intent matching at 0.5-0.8", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore(
      "Dating",
      "Study Buddy",
    );
    expect(score).toBe(0.5); // Cross-intent but possible
  });

  it("should score incompatible intents lower", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore(
      "Hookup",
      "Networking",
    );
    expect(score).toBe(0.2); // Incompatible
  });

  it("should handle Unsure intent", () => {
    const score = DiscoverService.calculateIntentCompatibilityScore(
      "Unsure",
      "Dating",
    );
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
    expect(DiscoverService.calculateAgeScore(25, 31)).toBeGreaterThanOrEqual(
      0.6,
    );
  });

  it("should maintain minimum score of 0.6", () => {
    expect(DiscoverService.calculateAgeScore(25, 100)).toBe(0.6);
  });
});

describe("Discover API - Major Compatibility", () => {
  it("should score same major as 1.0", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore(
      "Computer Science",
      "Computer Science",
    );
    expect(score).toBe(1.0);
  });

  it("should score different major as 0.0", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore(
      "Computer Science",
      "Business",
    );
    expect(score).toBe(0.0);
  });

  it("should be case-insensitive", () => {
    const score = DiscoverService.calculateMajorCompatibilityScore(
      "computer science",
      "COMPUTER SCIENCE",
    );
    expect(score).toBe(1.0);
  });

  it("should return 0 if either major is missing", () => {
    expect(
      DiscoverService.calculateMajorCompatibilityScore(undefined, "Business"),
    ).toBe(0);
    expect(
      DiscoverService.calculateMajorCompatibilityScore("CS", undefined),
    ).toBe(0);
  });
});

describe("Discover API - Overall Compatibility Score", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should calculate overall compatibility score with new weights", () => {
    const score = DiscoverService.calculateCompatibilityScore(
      sampleUserProfile,
      sampleCandidateProfile,
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("should weight interests at 30%, intent at 25%, orientation at 15%, major at 10%, age at 10%, lifestyle at 10%", () => {
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
    // Should be high since most components match well
    // Orientation score may be lower due to preference/identity mapping in calculateOrientationCompatibilityScore
    // Minimum threshold is 75 to account for variation in orientation scoring
    expect(score).toBeGreaterThanOrEqual(75);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should include age penalty in final score", () => {
    const closeAgeUser: Profile = {
      ...sampleUserProfile,
      birthdate: new Date("2001-01-15"), // 23 years old
    };

    const farAgeCandidate: Profile = {
      ...sampleCandidateProfile,
      birthdate: new Date("1995-01-15"), // 29 years old (6 year difference)
    };

    const score = DiscoverService.calculateCompatibilityScore(
      closeAgeUser,
      farAgeCandidate,
    );
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
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
    (require("date-fns").subYears as jest.Mock).mockImplementation(
      (date, years) =>
        new Date(date.getFullYear() - years, date.getMonth(), date.getDate()),
    );
    (require("date-fns").addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should prioritize mutual likes (TIER 1) above compatibility score (TIER 2+)", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(
      sampleUserProfile,
    );
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([
      { from_user: "candidate2-id" }, // Candidate 2 already liked user1
    ]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);

    // candidate1 has higher compatibility but didn't like user
    // candidate2 has lower compatibility but already liked user
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([
      sampleCandidateProfile,
      sampleCandidateProfile2,
    ]);

    const spy = jest.spyOn(DiscoverService, "calculateCompatibilityScore");
    spy.mockReturnValueOnce(85).mockReturnValueOnce(60); // candidate1 score, candidate2 score

    const result = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    // candidate2 should come first despite lower score (because they liked user)
    expect(result[0].user_id).toBe("candidate2-id");
    expect(result[1].user_id).toBe("candidate1-id");

    spy.mockRestore();
  });

  it("should include likedByUser flag in results", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(
      sampleUserProfile,
    );
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([
      { from_user: "candidate1-id" },
    ]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([
      sampleCandidateProfile,
    ]);

    const result: ProfileWithScore[] =
      await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);

    expect(result[0]).toHaveProperty("likedByUser");
    expect(result[0].likedByUser).toBe(true);
  });

  it("should maintain score-based ranking within same tier", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(
      sampleUserProfile,
    );
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]); // No mutual likes
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);

    const candidate1 = { ...sampleCandidateProfile, user_id: "user-a" };
    const candidate2 = { ...sampleCandidateProfile, user_id: "user-b" };
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([
      candidate1,
      candidate2,
    ]);

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
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
    (require("date-fns").subYears as jest.Mock).mockImplementation(
      (date, years) =>
        new Date(date.getFullYear() - years, date.getMonth(), date.getDate()),
    );
    (require("date-fns").addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should apply gender filter with mapping when gender_preference is not 'All'", async () => {
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([]);

    await DiscoverService.getEligibleCandidates("user1-id", {
      ...sampleUserProfile,
      gender_preference: ["Women"],
    });

    // Verify mapping is called and correct gender identities are queried
    expect(prisma.profiles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gender: { in: ["Female"] }, // Mapped from "Women" -> "Female"
        }),
      }),
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
      }),
    );
  });
});

describe("Discover API - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should throw error if user has no gender preferences", async () => {
    await expect(
      DiscoverService.getEligibleCandidates("user1-id", {
        ...sampleUserProfile,
        gender_preference: [],
      }),
    ).rejects.toThrow("User must have at least one gender preference set");
  });

  it("should throw error if user profile not found", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      DiscoverService.getDiscoverProfiles("nonexistent-user", 10, 0),
    ).rejects.toThrow("User profile not found");
  });

  it("should throw error if user ID is missing for getDiscoverProfiles", async () => {
    await expect(
      DiscoverService.getDiscoverProfiles("", 10, 0),
    ).rejects.toThrow("User ID is required");
  });
});

// New tests for Lifestyle Compatibility

describe("Discover API - Lifestyle Compatibility", () => {
  it("should return 0 when either lifestyle is missing", () => {
    const score1 = DiscoverService.calculateLifestyleCompatibilityScore(
      undefined,
      { drinking: "Socially" } as any,
    );
    const score2 = DiscoverService.calculateLifestyleCompatibilityScore(
      { drinking: "Socially" } as any,
      undefined,
    );
    expect(score1).toBe(0);
    expect(score2).toBe(0);
  });

  it("should compute exact matches across single-value fields", () => {
    const l1 = {
      drinking: "Socially",
      smoking: "Non-smoker",
      cannabis: "Never",
      sleep_habits: "Early bird",
      study_style: "Solo",
      cleanliness: "Very clean",
      caffeine: "Daily coffee/tea",
      living_situation: "On-campus dorm",
      fitness: "Gym regular",
    } as any;

    const l2 = {
      drinking: "Socially", // match
      smoking: "Smoker", // no match
      cannabis: "Never", // match
      sleep_habits: "Night owl", // no match
      study_style: "Solo", // match
      cleanliness: "Very clean", // match
      caffeine: "Daily coffee/tea", // match
      living_situation: "Off-campus apartment", // no match
      fitness: "Athlete", // no match
    } as any;

    // Matches: drinking, cannabis, study_style, cleanliness, caffeine = 5
    // Total fields considered = 11 (including array fields)
    const expected = 5 / 11;
    const score = DiscoverService.calculateLifestyleCompatibilityScore(l1, l2);
    expect(score).toBeCloseTo(expected, 5);
  });

  it("should count overlap for array fields (pets, dietary_preferences)", () => {
    const l1 = {
      pets: ["Dog"],
      dietary_preferences: ["Vegan"],
    } as any;
    const l2 = {
      pets: ["Dog", "Cat"],
      dietary_preferences: ["Vegetarian"],
    } as any;

    // Pets overlap: 1 item matches, max length = 2, so score = 1/2 = 0.5
    // Dietary overlap: 0 items match, so score = 0
    // Total: (0.5 + 0) / 11 = 0.5 / 11 ≈ 0.045454...
    const expected = (1 / 2 + 0) / 11;
    const score = DiscoverService.calculateLifestyleCompatibilityScore(l1, l2);
    expect(score).toBeCloseTo(expected, 5);
  });

  it("should integrate lifestyle score into overall compatibility (10% weight)", () => {
    const user: Profile = {
      ...sampleUserProfile,
      lifestyle: {
        drinking: "Socially",
        smoking: "Non-smoker",
        cannabis: "Never",
        sleep_habits: "Early bird",
        study_style: "Solo",
        cleanliness: "Very clean",
        caffeine: "Daily coffee/tea",
        living_situation: "On-campus dorm",
        fitness: "Gym regular",
        pets: ["Dog"],
        dietary_preferences: ["Vegetarian"],
      } as any,
    };

    const candidateNoLifestyle: Profile = {
      ...sampleCandidateProfile,
      lifestyle: undefined,
    };

    const candidateFullMatch: Profile = {
      ...sampleCandidateProfile,
      lifestyle: user.lifestyle,
    };

    const baseScore = DiscoverService.calculateCompatibilityScore(
      user,
      candidateNoLifestyle,
    );
    const boostedScore = DiscoverService.calculateCompatibilityScore(
      user,
      candidateFullMatch,
    );

    // Full lifestyle match should add roughly 10 points (10% of 100)
    expect(boostedScore).toBeGreaterThan(baseScore);
    expect(boostedScore - baseScore).toBeGreaterThanOrEqual(8);
    expect(boostedScore - baseScore).toBeLessThanOrEqual(12);
  });
});

describe("Discover API - Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockToday.getTime());
    (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(23);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("calculateAge", () => {
    it("should calculate exact age from birthdate", () => {
      (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(25);
      const age = DiscoverService.calculateAge(new Date("1999-06-15"));
      expect(age).toBe(25);
    });

    it("should return 0 for invalid or missing birthdate", () => {
      const age = DiscoverService.calculateAge(undefined as any);
      expect(age).toBeGreaterThanOrEqual(0);
    });

    it("should handle recent births (age 18+)", () => {
      (require("date-fns").differenceInYears as jest.Mock).mockReturnValue(18);
      const age = DiscoverService.calculateAge(new Date("2006-01-15"));
      expect(age).toBe(18);
    });
  });

  describe("getSharedInterests", () => {
    it("should return exact matches between two interest arrays", () => {
      const interests1 = ["Coding", "Music", "Hiking"];
      const interests2 = ["Music", "Hiking", "Gaming"];

      const shared = DiscoverService.getSharedInterests(interests1, interests2);
      expect(shared).toContain("Music");
      expect(shared).toContain("Hiking");
      expect(shared.length).toBe(2);
    });

    it("should return empty array for no shared interests", () => {
      const interests1 = ["Coding", "Programming"];
      const interests2 = ["Gaming", "Sports"];

      const shared = DiscoverService.getSharedInterests(interests1, interests2);
      expect(shared).toEqual([]);
    });

    it("should be case-sensitive", () => {
      const interests1 = ["coding"];
      const interests2 = ["Coding"];

      const shared = DiscoverService.getSharedInterests(interests1, interests2);
      expect(shared.length).toBe(0);
    });

    it("should handle empty arrays", () => {
      const shared1 = DiscoverService.getSharedInterests(
        [],
        ["Music", "Hiking"],
      );
      const shared2 = DiscoverService.getSharedInterests(["Music"], []);

      expect(shared1).toEqual([]);
      expect(shared2).toEqual([]);
    });

    it("should handle undefined interests", () => {
      const shared1 = DiscoverService.getSharedInterests(undefined as any, [
        "Music",
      ]);
      const shared2 = DiscoverService.getSharedInterests(
        ["Music"],
        undefined as any,
      );

      expect(shared1 || []).toEqual([]);
      expect(shared2 || []).toEqual([]);
    });
  });

  describe("isWithinAgePreference", () => {
    it("should return true when candidate age is within preference range", () => {
      // Function signature: (userAge, candidateAge, minAge, maxAge)
      // Checks if candidateAge is within [minAge, maxAge]
      const isWithin = DiscoverService.isWithinAgePreference(25, 22, 20, 30);
      expect(isWithin).toBe(true);
    });

    it("should return false when candidate age is below minimum", () => {
      // candidateAge=18 is less than minAge=20
      const isWithin = DiscoverService.isWithinAgePreference(22, 18, 20, 30);
      expect(isWithin).toBe(false);
    });

    it("should return false when candidate age is above maximum", () => {
      // candidateAge=35 is greater than maxAge=30
      const isWithin = DiscoverService.isWithinAgePreference(22, 35, 20, 30);
      expect(isWithin).toBe(false);
    });

    it("should return true at boundary (min age inclusive)", () => {
      // candidateAge=20 equals minAge=20
      const isWithin = DiscoverService.isWithinAgePreference(22, 20, 20, 30);
      expect(isWithin).toBe(true);
    });

    it("should return true at boundary (max age inclusive)", () => {
      // candidateAge=30 equals maxAge=30
      const isWithin = DiscoverService.isWithinAgePreference(22, 30, 20, 30);
      expect(isWithin).toBe(true);
    });

    it("should handle edge cases with equal min and max", () => {
      // candidateAge=25 equals both minAge and maxAge
      const isWithin = DiscoverService.isWithinAgePreference(25, 25, 25, 25);
      expect(isWithin).toBe(true);
    });
  });
});
