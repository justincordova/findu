if (!process.env.EXPO_PUBLIC_API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required');
}

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/blocks`;

/**
 * Helper to extract JSON response and handle errors
 * @param {Response} res - Fetch response object
 * @returns {Promise<any>} Parsed JSON response or empty object
 * @throws {Error} Throws error with context preserved if response is not ok
 */
async function handleResponse(res: Response) {
  let data: any;
  try {
    data = await res.json();
  } catch (parseError) {
    throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  if (!res.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return data;
}

export const BlocksAPI = {
  /**
   * Block a user
   * @param {string} token - Authentication token
   * @param {string} blockedUserId - ID of user to block
   * @returns {Promise<{message: string; block: any}>}
   */
  blockUser: async (token: string, blockedUserId: string) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ blockedId: blockedUserId }),
    });
    return handleResponse(res);
  },

  /**
   * Unblock a user
   * @param {string} token - Authentication token
   * @param {string} blockedUserId - ID of user to unblock
   * @returns {Promise<{message: string}>}
   */
  unblockUser: async (token: string, blockedUserId: string) => {
    const res = await fetch(`${API_BASE}/${blockedUserId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(res);
  },

  /**
   * Get list of blocked users
   * @param {string} token - Authentication token
   * @returns {Promise<any[]>} Array of blocked user profiles
   */
  getBlockedUsers: async (token: string) => {
    const res = await fetch(`${API_BASE}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(res);
  },
};
