import axios from "axios";
import { Profile } from "@/types/Profile";
import { supabase } from "../lib/supabaseClient";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/profiles`;

const authHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  return { Authorization: token ? `Bearer ${token}` : "" };
};

export const profileApi = {
  create: async (data: Profile) => {
    const headers = await authHeaders();
    const response = await axios.post(API_BASE, data, { headers });
    return response.data;
  },

  update: async (userId: string, data: Partial<Profile>) => {
    const headers = await authHeaders();
    const response = await axios.patch(`${API_BASE}/${userId}`, data, {
      headers,
    });
    return response.data;
  },

  get: async (userId: string) => {
    const headers = await authHeaders();
    const response = await axios.get(`${API_BASE}/${userId}`, { headers });
    return response.data;
  },

  delete: async (userId: string) => {
    const headers = await authHeaders();
    const response = await axios.delete(`${API_BASE}/${userId}`, { headers });
    return response.data;
  },
};
