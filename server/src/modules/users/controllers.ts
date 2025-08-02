import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import type { User, UpdateUserData } from "@/types/User";
import logger from "@/config/logger";

const prisma = new PrismaClient();

// Sanitize user object to exclude hashed_password
const sanitizeUser = (user: any): Omit<User, "hashed_password"> => {
  const { hashed_password, ...sanitized } = user;
  return sanitized;
};

// Check if a user exists by email or username
const checkUserExists = async (
  prisma: PrismaClient,
  email: string,
  username: string,
  excludeId?: string
) => {
  const whereCondition = {
    OR: [{ email }, { username }],
    ...(excludeId && { id: { not: excludeId } }),
  };

  const existingUser = await prisma.users.findFirst({ where: whereCondition });
  return existingUser !== null;
};

export const createUserController = async (req: Request, res: Response) => {
  const { email, username, f_name, l_name, password, role } = req.body;

  if (!email || !username || !f_name || !l_name || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (username.length < 3 || username.length > 30) {
    return res
      .status(400)
      .json({ error: "Username must be between 3–30 characters" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  try {
    const exists = await checkUserExists(
      prisma,
      email.toLowerCase().trim(),
      username.toLowerCase().trim()
    );

    if (exists) {
      return res
        .status(409)
        .json({ error: "Email or username already exists" });
    }

    const hashed_password = await bcrypt.hash(password, 12);

    const newUser = await prisma.users.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        f_name: f_name.trim(),
        l_name: l_name.trim(),
        hashed_password,
        role: role === "admin" ? "admin" : "user",
      },
    });

    const userResponse = sanitizeUser(newUser);

    logger.info("USER_CREATED", {
      userId: userResponse.id,
      email: userResponse.email,
      username: userResponse.username,
    });

    return res.status(201).json(userResponse);
  } catch (error) {
    logger.error("USER_CREATION_FAILED", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        f_name: true,
        l_name: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json(users);
  } catch (error) {
    logger.error("GET_ALL_USERS_FAILED", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        f_name: true,
        l_name: true,
        created_at: true,
        updated_at: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info("USER_VIEWED", {
      userId: user.id,
      viewedBy: "system",
    });

    res.json(user);
  } catch (error) {
    logger.error("GET_USER_BY_ID_FAILED", {
      userId: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { email, username, f_name, l_name, password } = req.body;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
  } catch {
    return res.status(404).json({ error: "User not found" });
  }

  const updates: UpdateUserData = {};

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    updates.email = email.toLowerCase().trim();
  }

  if (username) {
    if (username.length < 3 || username.length > 30) {
      return res
        .status(400)
        .json({ error: "Username must be between 3–30 characters" });
    }
    updates.username = username.toLowerCase().trim();
  }

  if (f_name !== undefined) updates.f_name = f_name.trim();
  if (l_name !== undefined) updates.l_name = l_name.trim();

  if (password) {
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }
    updates.hashed_password = await bcrypt.hash(password, 12);
  }

  if (email || username) {
    try {
      const checkEmail = email || "";
      const checkUsername = username || "";
      const exists = await checkUserExists(
        prisma,
        checkEmail,
        checkUsername,
        id
      );
      if (exists) {
        return res
          .status(409)
          .json({ error: "Email or username already exists" });
      }
    } catch (error) {
      logger.error("DUPLICATE_CHECK_FAILED", {
        userId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        f_name: true,
        l_name: true,
        created_at: true,
        updated_at: true,
        role: true,
      },
    });

    logger.info("USER_UPDATED", {
      userId: updatedUser.id,
      updatedBy: "system",
      fieldsUpdated: Object.keys(updates),
    });

    res.json(updatedUser);
  } catch (error: any) {
    logger.error("UPDATE_USER_FAILED", {
      userId: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.users.delete({ where: { id } });

    logger.info("USER_DELETED", {
      userId: id,
      deletedBy: "system",
    });

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    logger.error("DELETE_USER_FAILED", {
      userId: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
