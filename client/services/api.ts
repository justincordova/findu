import { supabase } from "./supabase";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  return fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
