// Auth Result Types
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserData;
  session?: any;
}

export interface PendingSignupResult {
  success: boolean;
  error?: string;
}

// User Data Types
export interface UserData {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Request/Response Types
export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

// Database Types
export interface PendingSignup {
  id: string;
  email: string;
  hashed_password: string;
  verification_token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Email Types
export interface EmailVerificationData {
  email: string;
  verificationToken: string;
  userId: string;
}
