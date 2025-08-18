// Auth configuration
export const AUTH_CONFIG = {
  // Token expiration settings (in seconds)
  TOKEN_EXPIRY: {
    // Access token expiry (default: 1 hour)
    ACCESS_TOKEN: parseInt(
      process.env.EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY || "3600"
    ),
    // Refresh token expiry (default: 7 days)
    REFRESH_TOKEN: parseInt(
      process.env.EXPO_PUBLIC_REFRESH_TOKEN_EXPIRY || "604800"
    ),
    // Session expiry (default: 30 days)
    SESSION: parseInt(process.env.EXPO_PUBLIC_SESSION_EXPIRY || "2592000"),
  },

  // Auto-refresh settings
  AUTO_REFRESH: {
    // Refresh token when it's within this many seconds of expiring (default: 5 minutes)
    THRESHOLD: parseInt(
      process.env.EXPO_PUBLIC_AUTO_REFRESH_THRESHOLD || "300"
    ),
    // Enable automatic token refresh
    ENABLED: process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED !== "false",
  },

  // Security settings
  SECURITY: {
    // Clear tokens on app background (default: true)
    CLEAR_ON_BACKGROUND:
      process.env.EXPO_PUBLIC_CLEAR_TOKENS_ON_BACKGROUND !== "false",
    // Require biometric authentication for sensitive operations (default: false)
    REQUIRE_BIOMETRIC: process.env.EXPO_PUBLIC_REQUIRE_BIOMETRIC === "true",
  },
};

// Helper function to check if token needs refresh
export const shouldRefreshToken = (expiresAt: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  return timeUntilExpiry <= AUTH_CONFIG.AUTO_REFRESH.THRESHOLD;
};

// Helper function to get formatted expiry time
export const getFormattedExpiryTime = (expiresAt: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;

  if (timeUntilExpiry <= 0) {
    return "Expired";
  }

  const hours = Math.floor(timeUntilExpiry / 3600);
  const minutes = Math.floor((timeUntilExpiry % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
};
