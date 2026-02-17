import { prisma } from '@/lib/prismaClient';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.BETTER_AUTH_SECRET || 'test-secret';

/**
 * Create a test user in the database
 * @returns Object with user data and test token
 */
export async function createTestUser() {
  const userId = randomUUID();
  const email = `test-${userId}@test.edu`;

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.users.create({
    data: {
      id: userId,
      email,
      name: 'Test User',
      emailVerified: true,
    },
  });

  // Create account with password
  await prisma.accounts.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: email,
      password: hashedPassword,
    },
  });

  // Generate test token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
}

/**
 * Create a test profile for a user
 * @param userId - User ID to create profile for
 * @returns Created profile
 */
export async function createTestProfile(userId: string) {
  return await prisma.profiles.create({
    data: {
      user_id: userId,
      name: 'Test Profile',
      avatar_url: 'https://example.com/avatar.jpg',
      birthdate: new Date('2000-01-01'),
      gender: 'Male',
      pronouns: 'he/him',
      university_id: 'uni1',
      campus_id: 'campus1',
      university_year: 3,
      major: 'Computer Science',
      grad_year: 2025,
      interests: ['Music', 'Movies'],
      intent: 'Dating',
      gender_preference: ['Women'],
      sexual_orientation: 'Straight',
      min_age: 18,
      max_age: 30,
      photos: ['https://example.com/photo1.jpg'],
      bio: 'Test bio',
      lifestyle: {},
    },
  });
}

/**
 * Create a test OTP verification token
 * @param email - Email to create OTP for
 * @returns OTP code
 */
export async function createTestOTP(email: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.verification_tokens.create({
    data: {
      identifier: email,
      value: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  return otp;
}

/**
 * Generate a test JWT token for a user
 * @param userId - User ID to generate token for
 * @returns JWT token string
 */
export function generateTestToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Clean up all test data
 * Deletes all test users, profiles, likes, matches, blocks, and chats
 */
export async function cleanupTestData() {
  await prisma.chats.deleteMany({});
  await prisma.matches.deleteMany({});
  await prisma.blocks.deleteMany({});
  await prisma.likes.deleteMany({});
  await prisma.profiles.deleteMany({});
  await prisma.accounts.deleteMany({});
  await prisma.verification_tokens.deleteMany({});
  await prisma.users.deleteMany({});
}

/**
 * Create a test match between two users
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Created match
 */
export async function createTestMatch(user1Id: string, user2Id: string) {
  return await prisma.matches.create({
    data: {
      user1: user1Id,
      user2: user2Id,
    },
  });
}

/**
 * Create a test like from one user to another
 * @param fromUserId - User sending the like
 * @param toUserId - User receiving the like
 * @param isSuperlike - Whether this is a superlike
 * @returns Created like
 */
export async function createTestLike(
  fromUserId: string,
  toUserId: string,
  isSuperlike: boolean = false
) {
  return await prisma.likes.create({
    data: {
      from_user: fromUserId,
      to_user: toUserId,
      is_superlike: isSuperlike,
    },
  });
}

/**
 * Create a test block from one user to another
 * @param blockerId - User blocking
 * @param blockedId - User being blocked
 * @returns Created block
 */
export async function createTestBlock(blockerId: string, blockedId: string) {
  return await prisma.blocks.create({
    data: {
      blocker_id: blockerId,
      blocked_id: blockedId,
    },
  });
}
