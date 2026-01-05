import { handleResponse } from "./utils";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/likes`;

export const LikesAPI = {
  /**
   * Create a like or superlike from one user to another
   * Returns match status if mutual like exists
   * @param {string} token - Authentication token
   * @param {string} fromUserId - ID of user sending the like
   * @param {string} toUserId - ID of user receiving the like
   * @param {boolean} isSuperlike - Whether this is a superlike (default: false)
   * @returns {Promise<{success: boolean; matched: boolean; error?: string}>}
   */
  createLike: async (token: string, fromUserId: string, toUserId: string, isSuperlike: boolean = false) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ from_user: fromUserId, to_user: toUserId, is_superlike: isSuperlike }),
    });
    return handleResponse(res);
  },
};
