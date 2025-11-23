const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/likes`;

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const LikesAPI = {
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
