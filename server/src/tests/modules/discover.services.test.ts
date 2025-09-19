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
  gender: "male",
  pronouns: "he/him",
  bio: "Love hiking and music!",
  university_id: "uni-123",
  campus_id: null,
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
  university_id: "uni-123",
  campus_id: null,
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
    (require('date-fns').subYears as jest.Mock).mockImplementation(
      (date, years) => new Date(date.getFullYear() - years, date.getMonth(), date.getDate())
    );
    (require('date-fns').addDays as jest.Mock).mockImplementation(
      (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("should calculate age correctly", () => {
    (require('date-fns').differenceInYears as jest.Mock).mockReturnValue(25);
    const age = DiscoverService.calculateAge(mockBirthdate);
    expect(age).toBe(25);
  });

  it("should return shared interests between two arrays", () => {
    expect(DiscoverService.getSharedInterests(["hiking","music","coding"], ["hiking","music","reading"]))
      .toEqual(["hiking","music"]);
  });

  it("should return true if candidate age is within range", () => {
    expect(DiscoverService.isWithinAgePreference(23,25,20,30)).toBe(true);
  });

  it("should calculate overall compatibility score correctly", () => {
    const score = DiscoverService.calculateCompatibilityScore(sampleUserProfile, sampleCandidateProfile);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("should return discover profiles with compatibility scores", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleUserProfile);
    (prisma.likes.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.matches.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.blocks.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.profiles.findMany as jest.Mock).mockResolvedValue([sampleCandidateProfile, sampleCandidateProfile2]);

    const result: ProfileWithScore[] = await DiscoverService.getDiscoverProfiles("user1-id", 10, 0);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('compatibilityScore');
    expect(typeof result[0].compatibilityScore).toBe('number');
  });

  it("should maintain score-based ordering within tiers", () => {
    const candidates: ProfileWithScore[] = [
      { ...sampleCandidateProfile, user_id:"low1", compatibilityScore:15 },
      { ...sampleCandidateProfile, user_id:"high1", compatibilityScore:85 },
      { ...sampleCandidateProfile, user_id:"mid1", compatibilityScore:50 },
      { ...sampleCandidateProfile, user_id:"high2", compatibilityScore:90 },
      { ...sampleCandidateProfile, user_id:"low2", compatibilityScore:10 },
    ];

    const result = DiscoverService.rankCandidatesWithRandomization(candidates);
    expect(result).toHaveLength(5);
    const highScoreCandidates = result.filter(c => c.compatibilityScore >= 81);
    expect(highScoreCandidates).toHaveLength(2);
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

  it("should throw error if user has no gender preferences", async () => {
    await expect(
      DiscoverService.getEligibleCandidates("user1-id", { ...sampleUserProfile, gender_preference: [] })
    ).rejects.toThrow("User must have at least one gender preference set");
  });

  it("should throw error if user profile not found", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(DiscoverService.getDiscoverProfiles("nonexistent-user",10,0)).rejects.toThrow("User profile not found");
  });
});
