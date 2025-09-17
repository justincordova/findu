import * as ProfileService from "@/modules/profile/services";
import { Profile } from "@/types/Profile";
import prisma from "@/lib/prismaClient";
import logger from "@/config/logger";

// Mock prisma and logger
jest.mock("@/lib/prismaClient", () => ({
  profiles: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Top-level constants for all tests
const userId = "user-id";
const sampleProfile: Profile = {
  user_id: userId,
  name: "John Doe",
  avatar_url: "http://example.com/avatar.jpg",
  birthdate: new Date("2000-01-01"),
  gender: "male",
  pronouns: "he/him",
  bio: "Hello world",
  university: "Example University",
  university_year: 2,
  major: "Computer Science",
  grad_year: 2024,
  interests: ["coding", "music"],
  intent: "networking",
  gender_preference: ["female"],
  sexual_orientation: "heterosexual",
  min_age: 18,
  max_age: 30,
  spotify_url: "http://spotify.com/user",
  instagram_url: "http://instagram.com/user",
  photos: ["http://example.com/photo1.jpg"],
  created_at: new Date(),
  updated_at: new Date(),
};

describe("Profile Service happy path cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a profile successfully", async () => {
    (prisma.profiles.create as jest.Mock).mockResolvedValue(sampleProfile);

    const result = await ProfileService.createProfile(sampleProfile);

    expect(prisma.profiles.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...sampleProfile,
        updated_at: expect.any(Date),
      }),
    });
    expect(result).toEqual(sampleProfile);
  });

  it("should fetch a profile by user ID", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleProfile);

    const result = await ProfileService.getProfileByUserId(userId);

    expect(prisma.profiles.findUnique).toHaveBeenCalledWith({
      where: { user_id: userId },
    });
    expect(result).toEqual(sampleProfile);
  });

  it("should update a profile successfully", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleProfile);
    (prisma.profiles.update as jest.Mock).mockResolvedValue(sampleProfile);

    const partialUpdate: Partial<Profile> = {
      birthdate: new Date("1999-12-31"),
    };
    const result = await ProfileService.updateProfile(userId, partialUpdate);

    expect(prisma.profiles.update).toHaveBeenCalledWith({
      where: { user_id: userId },
      data: expect.objectContaining({
        birthdate: new Date("1999-12-31"),
        updated_at: expect.any(Date),
      }),
    });
    expect(result).toEqual(sampleProfile);
  });

  it("should delete a profile successfully", async () => {
    (prisma.profiles.delete as jest.Mock).mockResolvedValue(undefined);

    await ProfileService.deleteProfile(userId);

    expect(prisma.profiles.delete).toHaveBeenCalledWith({
      where: { user_id: userId },
    });
  });
});

describe("Profile Service edge & failure cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when updating a non-existent profile", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);

    const partialUpdate: Partial<Profile> = {
      birthdate: new Date("1999-12-31"),
    };
    const result = await ProfileService.updateProfile(
      "non-existent-user",
      partialUpdate
    );

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("PROFILE_NOT_FOUND_FOR_UPDATE", {
      userId: "non-existent-user",
    });
  });

  it("should return null when fetching a non-existent profile", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await ProfileService.getProfileByUserId("non-existent-user");

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("PROFILE_NOT_FOUND", {
      userId: "non-existent-user",
    });
  });

  it("should throw an error if create fails", async () => {
    const error = new Error("DB error");
    (prisma.profiles.create as jest.Mock).mockRejectedValue(error);

    await expect(ProfileService.createProfile(sampleProfile)).rejects.toThrow(
      "DB error"
    );
    expect(logger.error).toHaveBeenCalledWith("CREATE_PROFILE_ERROR", {
      error,
      profileData: sampleProfile,
    });
  });

  it("should throw an error if update fails", async () => {
    const error = new Error("DB error");
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleProfile);
    (prisma.profiles.update as jest.Mock).mockRejectedValue(error);

    await expect(
      ProfileService.updateProfile(userId, { bio: "New bio" })
    ).rejects.toThrow("DB error");
    expect(logger.error).toHaveBeenCalledWith("UPDATE_PROFILE_ERROR", {
      error,
      userId,
      profileData: { bio: "New bio" },
    });
  });

  it("should throw an error if getProfileByUserId fails", async () => {
    const error = new Error("DB error");
    (prisma.profiles.findUnique as jest.Mock).mockRejectedValue(error);

    await expect(ProfileService.getProfileByUserId(userId)).rejects.toThrow(
      "DB error"
    );
    expect(logger.error).toHaveBeenCalledWith("GET_PROFILE_ERROR", {
      error,
      userId,
    });
  });

  it("should throw an error if deleteProfile fails", async () => {
    const error = new Error("DB error");
    (prisma.profiles.delete as jest.Mock).mockRejectedValue(error);

    await expect(ProfileService.deleteProfile(userId)).rejects.toThrow(
      "DB error"
    );
    expect(logger.error).toHaveBeenCalledWith("DELETE_PROFILE_ERROR", {
      error,
      userId,
    });
  });

  it("should update only optional fields without affecting other profile data", async () => {
    (prisma.profiles.findUnique as jest.Mock).mockResolvedValue(sampleProfile);
    (prisma.profiles.update as jest.Mock).mockImplementation(({ data }) => {
      return { ...sampleProfile, ...data }; // merge updated fields
    });

    const partialUpdate: Partial<Profile> = {
      spotify_url: "http://spotify.com/new-user",
      instagram_url: "http://instagram.com/new-user",
    };

    const result = await ProfileService.updateProfile(userId, partialUpdate);

    expect(prisma.profiles.update).toHaveBeenCalledWith({
      where: { user_id: userId },
      data: expect.objectContaining({
        spotify_url: "http://spotify.com/new-user",
        instagram_url: "http://instagram.com/new-user",
        updated_at: expect.any(Date),
      }),
    });

    // Ensure unchanged fields are still intact
    expect(result?.name).toBe(sampleProfile.name);
    expect(result?.birthdate).toEqual(sampleProfile.birthdate);
    expect(result?.bio).toBe(sampleProfile.bio);
  });
});
