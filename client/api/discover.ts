import { handleResponse } from "./utils";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/discover`;

export const DiscoverAPI = {
  /**
   * Fetch discover feed with paginated profiles ranked by compatibility
   * @param {string} token - Authentication token
   * @param {number} limit - Number of profiles per page (default: 10)
   * @param {number} offset - Number of profiles to skip (default: 0)
   * @returns {Promise<{profiles: any[]; total: number; error?: string}>}
   */
  getFeed: async (token: string, limit: number = 10, offset: number = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<{ profiles?: any[] }>(res);
  },
};
