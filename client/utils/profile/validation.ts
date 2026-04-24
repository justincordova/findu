import type { Profile } from "@/types/Profile";

export function validateProfile(profile: Profile) {
  const errors: string[] = [];

  // Optional fields that can be null or empty
  const optionalFields = ["campus_id", "lifestyle"];

  for (const [key, value] of Object.entries(profile)) {
    // Skip validation for optional fields that are null
    if (
      optionalFields.includes(key) &&
      (value === null || value === undefined)
    ) {
      continue;
    }

    // Skip empty objects for optional fields
    if (
      optionalFields.includes(key) &&
      typeof value === "object" &&
      Object.keys(value as any).length === 0
    ) {
      continue;
    }

    if (value === null || value === undefined)
      errors.push(`Field "${key}" is required (value: ${value})`);
    else if (typeof value === "string" && value.trim() === "")
      errors.push(`Field "${key}" cannot be empty (value: "${value}")`);
    else if (Array.isArray(value) && value.length === 0)
      errors.push(
        `Field "${key}" must have at least one item (length: ${value.length})`,
      );
    else if (
      typeof value === "number" &&
      value <= 0 &&
      key !== "min_age" &&
      key !== "max_age"
    )
      errors.push(`Field "${key}" must be positive (value: ${value})`);
  }
  if (errors.length) {
    console.log("Profile validation errors:", errors);
    console.log("Full profile:", profile);
    throw new Error(`Profile validation failed: ${errors.join(", ")}`);
  }
}
