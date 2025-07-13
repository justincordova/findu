import { Router } from "express";
import { supabase } from "../app";
import bcrypt from "bcrypt";

const router = Router();

// Create User (POST /users)
router.post("/", async (req, res) => {
  const { email, username, f_name, l_name, password } = req.body;

  if (!email || !username || !f_name || !l_name || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if email or username exists
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      return res
        .status(409)
        .json({ error: "Email or username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ email, username, f_name, l_name, password_hash }])
      .select(); // without this supabase null instead of inserted data

    if (error) throw error;

    // Remove password_hash before sending response
    if (data && data[0]) {
      delete (data[0] as any).password_hash;
    }

    res.status(201).json(data?.[0] || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Get All Users (GET /users)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Get User by ID (GET /users/:id)
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Update User (PATCH /users/:id)
router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const { email, username, f_name, l_name, password } = req.body;

  const updates: any = {};
  if (email !== undefined) updates.email = email;
  if (username !== undefined) updates.username = username;
  if (f_name !== undefined) updates.f_name = f_name;
  if (l_name !== undefined) updates.l_name = l_name;
  if (password !== undefined) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }

    if (data) {
      delete (data as any).password_hash;
    }

    res.json(data || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Delete User (DELETE /users/:id)
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }

    res.json({ message: "User deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;
