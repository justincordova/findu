const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/constants`;

export interface Constants {
  intents: string[];
  majors: string[];
  genderPreferences: string[];
  sexualOrientations: string[];
  pronouns: string[];
}

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const ConstantsAPI = {
  getAll: async (): Promise<Constants> => {
    const res = await fetch(`${API_BASE}`);
    return handleResponse(res);
  },
};
