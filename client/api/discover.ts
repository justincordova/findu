const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/discover`;

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
    return handleResponse(res);
  },
};
