import { PrismaClient } from "@/generated/prisma";
import * as bcrypt from "bcrypt";

/**
 * Seed script specifically for jac352's profile
 * This script recreates jac352's user account and profile with all the same data
 * Use this after database resets to restore the profile
 *
 * Password: password123
 */

const prisma = new PrismaClient();

const jac352Data = {
  email: "jac352@njit.edu",
  name: "jac352",
  profile: {
    name: "justin",
    avatar_url: "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/avatar.jpeg",
    birthdate: "2005-06-30",
    gender: "Male",
    pronouns: "he/him",
    bio: "hi",
    university_year: 3,
    major: "Computer Science",
    grad_year: 2026,
    interests: [
      "Travel",
      "Music",
      "Cooking",
      "Movies",
      "Hiking",
      "Gaming",
      "Reading",
      "Fitness",
      "Photography"
    ],
    intent: "Dating",
    gender_preference: ["All"],
    sexual_orientation: "Straight",
    min_age: 18,
    max_age: 26,
    photos: [
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_0.jpeg?t=1765286592263?t=1765286592263",
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_1.jpeg",
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_2.jpeg?t=1765335728071",
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_3.jpeg",
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_4.jpeg",
      "https://gwaxrjeitjtxmlbahkye.supabase.co/storage/v1/object/public/profiles/cmiwet6z30000bi1f4a3cx1ci/photo_5.jpeg?t=1765334506957?t=1765334506957"
    ]
  }
};

async function seedJac352() {
  try {
    console.log("Starting jac352 seed...");

    // Get NJIT university
    const university = await prisma.universities.findUnique({
      where: { slug: "njit" }
    });

    if (!university) {
      throw new Error("NJIT university not found. Please run the main seed script first.");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: jac352Data.email }
    });

    if (existingUser) {
      console.log("jac352 user already exists. Skipping creation.");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash("password123", 12);

    // Create user with account
    const user = await prisma.user.create({
      data: {
        email: jac352Data.email,
        name: jac352Data.name,
        emailVerified: true,
        accounts: {
          create: {
            providerId: "credential",
            accountId: jac352Data.email,
            password: passwordHash,
          },
        },
      },
    });

    console.log(`Created user: ${user.email} (${user.id})`);

    // Create profile
    await prisma.profiles.create({
      data: {
        user_id: user.id,
        name: jac352Data.profile.name,
        avatar_url: jac352Data.profile.avatar_url,
        birthdate: new Date(jac352Data.profile.birthdate),
        gender: jac352Data.profile.gender,
        pronouns: jac352Data.profile.pronouns,
        bio: jac352Data.profile.bio,
        university_year: jac352Data.profile.university_year,
        major: jac352Data.profile.major,
        grad_year: jac352Data.profile.grad_year,
        interests: jac352Data.profile.interests,
        intent: jac352Data.profile.intent,
        gender_preference: jac352Data.profile.gender_preference,
        sexual_orientation: jac352Data.profile.sexual_orientation,
        min_age: jac352Data.profile.min_age,
        max_age: jac352Data.profile.max_age,
        photos: jac352Data.profile.photos,
        university_id: university.id,
      },
    });

    console.log(`Created profile for jac352 with ${jac352Data.profile.photos.length} photos`);
    console.log("jac352 seed completed successfully!");

  } catch (error) {
    console.error("Error seeding jac352:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedJac352();
