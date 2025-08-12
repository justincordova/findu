import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  // You can add token from storage here later
  return config;
});

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

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  session?: any;
  errors?: any[];
}

// Signup - Create pending signup
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post("/signup", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Verify email and create account
export const verifyEmail = async (
  data: EmailVerificationRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/verify", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Login
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post("/login", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (
  data: PasswordResetRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/forgot-password", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Reset password with token
export const resetPassword = async (
  data: PasswordResetConfirmRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/reset-password", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Logout
export const logout = async (): Promise<AuthResponse> => {
  try {
    const response = await api.post("/logout");
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await api.get("/me");
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};
