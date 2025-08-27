import { Profile } from "@/types/Profile";

export function validateProfile(profile: Profile) {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(profile)) {
    if (value === null || value === undefined)
      errors.push(`Field "${key}" is required`);
    else if (typeof value === "string" && value.trim() === "")
      errors.push(`Field "${key}" cannot be empty`);
    else if (Array.isArray(value) && value.length === 0)
      errors.push(`Field "${key}" must have at least one item`);
    else if (
      typeof value === "number" &&
      value <= 0 &&
      key !== "min_age" &&
      key !== "max_age"
    )
      errors.push(`Field "${key}" must be positive`);
  }
  if (errors.length)
    throw new Error("Profile validation failed: " + errors.join(", "));
}
