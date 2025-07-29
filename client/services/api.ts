import { useAuthStore } from "../store/authStore";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { accessToken, refreshToken, refreshTokens, logout } =
    useAuthStore.getState();

  // Helper function to make API call with token
  const makeRequest = async (token: string | null) => {
    return fetch(
      `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}${path}`,
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      }
    );
  };

  // Try with current access token
  let response = await makeRequest(accessToken);

  // If access token is expired (401), try to refresh
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(
        `${
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
        }/api/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (refreshResponse.ok) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          await refreshResponse.json();
        refreshTokens(newAccessToken, newRefreshToken);

        // Retry the original request with new access token
        response = await makeRequest(newAccessToken);
      } else {
        // Refresh failed, logout user
        logout();
        throw new Error("Session expired");
      }
    } catch (error) {
      logout();
      throw new Error("Failed to refresh token");
    }
  }

  return response;
}
