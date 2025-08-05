import { useAuthStore } from "../store/authStore";
import { authService } from "./authService";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { session, logout } = useAuthStore.getState();

  // Helper function to make API call with session token
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

  // Get current session token
  const token = session?.access_token || null;

  // Try with current session token
  let response = await makeRequest(token);

  // If session token is expired (401), try to refresh
  if (response.status === 401 && session?.refresh_token) {
    try {
      const newSession = await authService.refreshSession(
        session.refresh_token
      );

      if (newSession) {
        // Update session in store
        useAuthStore.getState().updateSession(newSession);

        // Retry the original request with new access token
        response = await makeRequest(newSession.access_token);
      } else {
        // No new session, logout user
        logout();
        throw new Error("Session expired");
      }
    } catch {
      logout();
      throw new Error("Failed to refresh session");
    }
  }

  return response;
}
