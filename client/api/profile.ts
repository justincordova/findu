import axios from "axios";
import { Profile } from "@/types/Profile";
import { useAuthStore } from "@/store/authStore";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/profiles`;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: token ? `Bearer ${token}` : "" };
};

export interface DomainMapResponse {
  university: {
    id: string;
    name: string;
    slug?: string;
  };
  campuses: {
    id: string;
    name: string;
    slug?: string;
  }[];
}

export const profileApi = {
  create: async (data: Profile) => {
    const headers = getAuthHeaders();
    const response = await axios.post(API_BASE, data, { headers });
    return response.data;
  },

  update: async (userId: string, data: Partial<Profile>) => {
    const headers = getAuthHeaders();
    const response = await axios.patch(`${API_BASE}/${userId}`, data, {
      headers,
    });
    return response.data;
  },

  get: async (userId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE}/${userId}`, { headers });
    return response.data;
  },

  delete: async (userId: string) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_BASE}/${userId}`, { headers });
    return response.data;
  },

  me: async () => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE}/me`, { headers });
    return response.data;
  },

  domainMap: async (email: string): Promise<DomainMapResponse> => {
    const headers = getAuthHeaders();
    const response = await axios.post<DomainMapResponse>(
      `${API_BASE}/domain-map`,
      { email },
      { headers }
    );
    return response.data;
  },
};
