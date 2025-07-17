export interface User {
  id: string;
  email: string;
  username: string;
  f_name: string;
  l_name: string;
  hashed_password?: string;
  role: string; // 'user' or 'admin'
  created_at: string;
  updated_at: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  f_name?: string;
  l_name?: string;
  hashed_password?: string;
  role?: string;
}
