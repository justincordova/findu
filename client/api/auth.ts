import { handleResponse } from "./utils";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;

// Type definitions for auth API responses
interface AuthUser {
  id: string;
  email: string;
}

interface SigninResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  error?: string;
}

interface SignupResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  error?: string;
}

interface SendOtpResponse {
  success: boolean;
  error?: string;
}

interface GetMeResponse {
  user: AuthUser;
  error?: string;
}

interface SignoutResponse {
  success: boolean;
  error?: string;
}

interface RefreshSessionResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  error?: string;
}

export const AuthAPI = {
  sendOtp: async (email: string): Promise<SendOtpResponse> => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse<SendOtpResponse>(res);
  },

  signup: async (
    email: string,
    password: string,
    otp: string
  ): Promise<SignupResponse> => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp }),
    });
    return handleResponse<SignupResponse>(res);
  },

  signin: async (email: string, password: string): Promise<SigninResponse> => {
    const res = await fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<SigninResponse>(res);
  },

  getMe: async (token: string): Promise<GetMeResponse> => {
    const res = await fetch(`${API_BASE}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<GetMeResponse>(res);
  },

  signout: async (token: string): Promise<SignoutResponse> => {
    const res = await fetch(`${API_BASE}/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<SignoutResponse>(res);
  },

  refreshSession: async (token: string): Promise<RefreshSessionResponse> => {
    const res = await fetch(`${API_BASE}/refresh-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<RefreshSessionResponse>(res);
  },
};