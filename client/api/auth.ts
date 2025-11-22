const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;

/** Helper to extract JSON and handle errors */
async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const AuthAPI = {
  // Request OTP for signup
  sendOtp: async (email: string) => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  // Signup with email, password, and OTP
  signup: async (email: string, password: string, otp: string) => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp }),
    });
    return handleResponse(res);
  },

  // Signin with email and password
  signin: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // Get current user info using a token
  getMe: async (token: string) => {
    const res = await fetch(`${API_BASE}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  // Signout the user
  signout: async (token: string) => {
    const res = await fetch(`${API_BASE}/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};