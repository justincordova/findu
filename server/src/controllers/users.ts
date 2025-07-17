import { Request, Response } from "express";
import bcrypt from "bcrypt";
import type { User, UpdateUserData } from "../types/User";

// Sanitize user object to exclude password hash
const sanitizeUser = (user: any): Omit<User, "password_hash"> => {
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

// Check if a user exists by email or username
const checkUserExists = async (
  prisma: any,
  email: string,
  username: string,
  excludeId?: string
) => {
  const whereCondition = {
    OR: [{ email }, { username }],
    ...(excludeId && { id: { not: excludeId } }),
  };

  const existingUser = await prisma.users.findFirst({
    where: whereCondition,
  });

  return existingUser !== null;
};

export const createUser = async (req: Request, res: Response) => {
  const prisma = res.locals.prisma;
  const { email, username, f_name, l_name, password } = req.body;

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

    const password_hash = await bcrypt.hash(password, 12);

    const newUser = await prisma.users.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        f_name: f_name.trim(),
        l_name: l_name.trim(),
        password_hash,
      },
    });

    const userResponse = sanitizeUser(newUser);
    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const prisma = res.locals.prisma;

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        f_name: true,
        l_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const prisma = res.locals.prisma;
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
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const prisma = res.locals.prisma;
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

  if (f_name !== undefined) {
    updates.f_name = f_name.trim();
  }

  if (l_name !== undefined) {
    updates.l_name = l_name.trim();
  }

  if (password) {
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }
    updates.password_hash = await bcrypt.hash(password, 12);
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
      console.error("Duplicate check error:", error);
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
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const prisma = res.locals.prisma;
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

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
