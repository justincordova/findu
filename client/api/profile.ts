import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types/Profile";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/profiles`;

/**
 * Get authorization headers with current auth token
 * @returns {{Authorization?: string}} Headers object with Bearer token (if available)
 */
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  /**
   * Create new user profile
   * @param {Profile} data - Profile data to create
   * @returns {Promise<Profile>} Created profile
   */
  create: async (data: Profile) => {
    const headers = getAuthHeaders();
    const { data: profileData } = await axios.post(API_BASE, data, { headers });
    return profileData;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID to update
   * @param {Partial<Profile>} data - Partial profile data to update
   * @returns {Promise<Profile>} Updated profile
   */
  update: async (userId: string, data: Partial<Profile>) => {
    const headers = getAuthHeaders();
    const { data: profileData } = await axios.patch(
      `${API_BASE}/${userId}`,
      data,
      {
        headers,
      },
    );
    return profileData;
  },

  /**
   * Get profile by user ID
   * @param {string} userId - User ID to fetch
   * @returns {Promise<Profile>} User profile
   */
  get: async (userId: string) => {
    const headers = getAuthHeaders();
    const { data: profileData } = await axios.get(`${API_BASE}/${userId}`, {
      headers,
    });
    return profileData;
  },

  /**
   * Delete user profile
   * @param {string} userId - User ID to delete
   * @returns {Promise<void>}
   */
  delete: async (userId: string) => {
    const headers = getAuthHeaders();
    const { data: profileData } = await axios.delete(`${API_BASE}/${userId}`, {
      headers,
    });
    return profileData;
  },

  /**
   * Get current authenticated user's profile
   * @returns {Promise<Profile>} Current user's profile
   */
  me: async () => {
    const headers = getAuthHeaders();
    const { data: profileData } = await axios.get(`${API_BASE}/me`, {
      headers,
    });
    return profileData;
  },

  /**
   * Get university and campus info from email domain
   * Used for profile setup to auto-populate institution data
   * @param {string} email - User email address
   * @returns {Promise<DomainMapResponse>} University and campus data
   */
  domainMap: async (email: string): Promise<DomainMapResponse> => {
    const headers = getAuthHeaders();
    const { data: domainData } = await axios.post<DomainMapResponse>(
      `${API_BASE}/domain-map`,
      { email },
      { headers },
    );
    return domainData;
  },
};
