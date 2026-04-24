import { handleResponse } from "./utils";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/likes`;

export const LikesAPI = {
  /**
   * Create a like or superlike from the authenticated user to another user.
   * The sender is derived from the auth token server-side.
   * Returns match status if mutual like exists.
   * @param {string} token - Authentication token
   * @param {string} toUserId - ID of user receiving the like
   * @param {boolean} isSuperlike - Whether this is a superlike (default: false)
   * @returns {Promise<{success: boolean; matched: boolean; error?: string}>}
   */
  createLike: async (
    token: string,
    toUserId: string,
    isSuperlike: boolean = false,
  ) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to_user: toUserId,
        is_superlike: isSuperlike,
      }),
    });
    return handleResponse<{ matched?: boolean }>(res);
  },
};
