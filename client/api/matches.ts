const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/matches`;

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

export const MatchesAPI = {
  /**
   * Fetch all mutual matches for authenticated user
   * Returns list of users with mutual likes
   * @param {string} token - Authentication token
   * @returns {Promise<{matches: any[]; total: number; error?: string}>}
   */
  getMatches: async (token: string) => {
    const res = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  /**
   * Unmatch with a user by match ID
   * Removes the match record from the database
   * @param {string} token - Authentication token
   * @param {string} matchId - ID of the match to delete
   * @returns {Promise<any>}
   */
  unmatch: async (token: string, matchId: string) => {
    const res = await fetch(`${API_BASE}/${matchId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};
