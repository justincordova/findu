import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma";
import * as bcrypt from "bcrypt";
import { redis, isRedisReady } from "./redis";

const prisma = new PrismaClient();
const saltRounds = 10;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: async (password) => {
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret",
  },
  // Use Redis as secondary storage for session data and rate limiting
  // Better Auth will use this for caching session data, improving performance
  secondaryStorage: isRedisReady()
    ? {
        get: async (key: string) => {
          try {
            const value = await redis.get(key);
            return value || null;
          } catch {} {
            return null;
          }
        },
        set: async (key: string, value: string, ttl?: number) => {
          try {
            if (ttl) {
              await redis.setex(key, ttl, value);
            } else {
              await redis.set(key, value);
            }
          } catch {} {
            // Fail silently, fallback to database
          }
        },
        delete: async (key: string) => {
          try {
            await redis.del(key);
          } catch {} {
            // Fail silently
          }
        },
      }
    : undefined,
});