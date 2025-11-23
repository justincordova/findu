const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/matches`;

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const MatchesAPI = {
  getMatches: async (token: string) => {
    const res = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};
