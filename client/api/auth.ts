const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;

/**
 * Helper to extract JSON response and handle errors
 * @param {Response} res - Fetch response object
 * @returns {Promise<any>} Parsed JSON response or empty object
 * @throws {any} Throws response data if response is not ok
 */
async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const AuthAPI = {
  /**
   * Request OTP for passwordless signup
   * @param {string} email - User email address
   * @returns {Promise<{success: boolean; error?: string}>}
   */
  sendOtp: async (email: string) => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  /**
   * Create account with email, password, and OTP verification
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {string} otp - One-time password from email
   * @returns {Promise<{success: boolean; token: string; user: {id: string; email: string}; error?: string}>}
   */
  signup: async (email: string, password: string, otp: string) => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp }),
    });
    return handleResponse(res);
  },

  /**
   * Authenticate user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<{success: boolean; token: string; user: {id: string; email: string}; error?: string}>}
   */
  signin: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  /**
   * Validate token and get current user session info
   * @param {string} token - Authentication token
   * @returns {Promise<{user: {id: string; email: string}; error?: string}>}
   */
  getMe: async (token: string) => {
    const res = await fetch(`${API_BASE}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  /**
   * Invalidate user session on backend
   * @param {string} token - Authentication token
   * @returns {Promise<{success: boolean; error?: string}>}
   */
  signout: async (token: string) => {
    const res = await fetch(`${API_BASE}/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};