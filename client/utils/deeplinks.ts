/**
 * Deeplink utilities for navigating within the app and generating shareable links
 */

const SCHEME = "findu://";

/**
 * Generate a deeplink for viewing a user's profile
 * @param userId - The user ID to view
 * @returns Deeplink URL
 */
export const getProfileDeeplink = (userId: string): string => {
  return `${SCHEME}profile/${userId}`;
};

/**
 * Parse a deeplink URL and extract parameters
 * @param url - Deeplink URL
 * @returns Parsed deeplink object or null if invalid
 */
export const parseDeeplink = (
  url: string,
): { route: string; params: Record<string, string> } | null => {
  if (!url.startsWith(SCHEME)) {
    return null;
  }

  const path = url.substring(SCHEME.length);
  const segments = path.split("/");

  if (segments[0] === "profile" && segments[1]) {
    return {
      route: "profile",
      params: { userId: segments[1] },
    };
  }

  return null;
};
