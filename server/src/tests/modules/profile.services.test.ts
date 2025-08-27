import * as profileService from "@/modules/profile/services";
import prisma from "@/lib/prismaClient";
import { Profile } from "@/types/Profile";

// Mock prisma methods
jest.mock("@/providers/prisma", () => ({
  __esModule: true,
  default: {
    profiles: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  profiles: {
    create: jest.Mock;
    update: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

describe("Profile Service", () => {
  const profileData: Profile = {
    user_id: "user-123",
    name: "Test User",
    avatar_url: "https://example.com/avatar.png",
    age: 25,
    birthdate: new Date("2000-01-01"),
    gender: "male",
    pronouns: "he/him",
    bio: "This is a test user",
    university: "Test University",
    university_year: 3,
    major: "Computer Science",
    grad_year: 2025,
    interests: ["coding", "music"],
    intent: "friendship",
    gender_preference: ["female"],
    sexual_orientation: "straight",
    min_age: 18,
    max_age: 30,
    spotify_url: "https://spotify.com/test",
    instagram_url: "https://instagram.com/test",
    photos: ["https://example.com/photo1.png"],
    created_at: new Date(),
    updated_at: new Date(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a profile", async () => {
    mockPrisma.profiles.create.mockResolvedValue(profileData);

    const result = await profileService.createProfile(profileData);

    expect(mockPrisma.profiles.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...profileData,
        updated_at: expect.any(Date),
      }),
    });
    expect(result).toEqual(profileData);
  });

  it("should update a profile", async () => {
    const updates = { bio: "Updated bio" };

    mockPrisma.profiles.findUnique.mockResolvedValue(profileData);
    mockPrisma.profiles.update.mockResolvedValue({
      ...profileData,
      ...updates,
    });

    const result = await profileService.updateProfile(
      profileData.user_id,
      updates
    );

    expect(mockPrisma.profiles.findUnique).toHaveBeenCalledWith({
      where: { user_id: profileData.user_id },
    });
    expect(mockPrisma.profiles.update).toHaveBeenCalledWith({
      where: { user_id: profileData.user_id },
      data: expect.objectContaining({
        ...updates,
        updated_at: expect.any(Date),
      }),
    });
    expect(result?.bio).toEqual("Updated bio");
  });

  it("should return null if profile not found on update", async () => {
    mockPrisma.profiles.findUnique.mockResolvedValue(null);
    const result = await profileService.updateProfile("nonexistent", {
      bio: "X",
    });
    expect(result).toBeNull();
  });

  it("should get a profile by userId", async () => {
    mockPrisma.profiles.findUnique.mockResolvedValue(profileData);
    const result = await profileService.getProfileByUserId(profileData.user_id);
    expect(mockPrisma.profiles.findUnique).toHaveBeenCalledWith({
      where: { user_id: profileData.user_id },
    });
    expect(result).toEqual(profileData);
  });

  it("should delete a profile", async () => {
    mockPrisma.profiles.delete.mockResolvedValue(profileData);
    await profileService.deleteProfile(profileData.user_id);
    expect(mockPrisma.profiles.delete).toHaveBeenCalledWith({
      where: { user_id: profileData.user_id },
    });
  });
});
