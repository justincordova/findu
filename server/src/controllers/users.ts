import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { User, UpdateUserData } from '../types/User';
import { validationResult } from 'express-validator';

// Remove sensitive data
// Created because some functions were returning the entire json which held the password hash which is a major security risk
const sanitizeUser = (user: any): Omit<User, 'password_hash'> => {
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

// Check if user exists
const checkUserExists = async (supabase: any, email: string, username: string, excludeId?: string) => {
  let query = supabase
    .from('users')
    .select('id, email, username')
    .or(`email.eq.${email},username.eq.${username}`);
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data && data.length > 0;
};

export const createUser = async (req: Request, res: Response) => {
  const supabase = res.locals.supabase;
  const { email, username, f_name, l_name, password } = req.body;

  // Validate required fields
  if (!email || !username || !f_name || !l_name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Username validation
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be between 3-30 characters' });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // Check if user already exists
    const exists = await checkUserExists(supabase, email.toLowerCase().trim(), username.toLowerCase().trim());
    if (exists) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12); // Increased salt rounds

    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email: email.toLowerCase().trim(), 
        username: username.toLowerCase().trim(), 
        f_name: f_name.trim(), 
        l_name: l_name.trim(), 
        password_hash 
      }])
      .select();

    if (error) throw error;

    if (data && data[0]) {
      const userResponse = sanitizeUser(data[0]);
      return res.status(201).json(userResponse);
    }

    res.status(201).json({});
  } catch (error) {
    const err = error as Error;
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const supabase = res.locals.supabase;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, f_name, l_name, created_at, updated_at'); // Exclude password_hash
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    const err = error as Error;
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const supabase = res.locals.supabase;
  const id = req.params.id;

  // Validate ID format (assuming UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, f_name, l_name, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    const err = error as Error;
    console.error('Get user by ID error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const supabase = res.locals.supabase;
  const id = req.params.id;
  const { email, username, f_name, l_name, password } = req.body;

  // Validate ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  // Check if user exists first
  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates: UpdateUserData = {};
  
  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    updates.email = email.toLowerCase().trim();
  }
  
  if (username !== undefined) {
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3-30 characters' });
    }
    updates.username = username.toLowerCase().trim();
  }
  
  if (f_name !== undefined) {
    updates.f_name = f_name.trim();
  }
  
  if (l_name !== undefined) {
    updates.l_name = l_name.trim();
  }
  
  if (password !== undefined) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    updates.password_hash = await bcrypt.hash(password, 12);
  }

  // Check for duplicate email/username (excluding current user)
  if (email || username) {
    try {
      const checkEmail = email || '';
      const checkUsername = username || '';
      const exists = await checkUserExists(supabase, checkEmail, checkUsername, id);
      if (exists) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, username, f_name, l_name, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    const err = error as Error;
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const supabase = res.locals.supabase;
  const id = req.params.id;

  // Validate ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    // Check if user exists first
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};