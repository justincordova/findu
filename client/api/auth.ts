import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use(async (config) => {
  try {
    // Import here to avoid circular dependency
    const { authService } = await import("../services/authService");
    const token = await authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error getting access token:", error);
  }
  return config;
});

// Handle token expiration in responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth state
      try {
        const { authService } = await import("../services/authService");
        await authService.signOut();
        // You might want to redirect to login here
      } catch (clearError) {
        console.error("Error clearing auth state:", clearError);
      }
    }
    return Promise.reject(error);
  }
);

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
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

// Verify OTP and create account
export const verifyOTP = async (
  data: OTPVerificationRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/verify-otp", data);
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
  email: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/forgot-password", { email });
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
  token: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/reset-password", { token, password });
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

// Refresh token
export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    const response = await api.post("/refresh");
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
