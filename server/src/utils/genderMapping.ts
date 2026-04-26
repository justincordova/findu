/**
 * Maps gender preference terms to gender identity terms for DB queries.
 * Preference (who you want): Men, Women, Non-binary, All, Other
 * Identity (what you are): Male, Female, Non-binary, Other
 */
const PREFERENCE_TO_IDENTITY_MAP: Record<string, string> = {
  Men: "Male",
  Women: "Female",
  "Non-binary": "Non-binary",
  Other: "Other",
};

/**
 * Converts array of gender preferences to gender identities for DB queries.
 * Example: ['Men', 'Women'] -> ['Male', 'Female']
 */
export function genderPreferencesToIdentities(preferences: string[]): string[] {
  if (preferences.includes("All")) {
    return ["Male", "Female", "Non-binary", "Other"];
  }
  return preferences.map((pref) => PREFERENCE_TO_IDENTITY_MAP[pref] || pref);
}
