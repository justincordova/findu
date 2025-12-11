import prisma from "@/lib/prismaClient";
import { genderPreferencesToIdentities } from "@/utils/genderMapping";

async function checkDatabase() {
  console.log("=== Checking Database for Discover Issue ===\n");

  const userId = "cmirsds4l0000biwp1pwkngkf";

  // Get current user
  const user = await prisma.profiles.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("Current User:");
  console.log("- Gender:", user.gender);
  console.log("- Gender Preferences:", user.gender_preference);
  console.log("- University ID:", user.university_id);
  console.log("- Campus ID:", user.campus_id);
  console.log("- Age Range:", `${user.min_age}-${user.max_age}`);
  console.log();

  // Get all profiles at same university
  const allProfiles = await prisma.profiles.findMany({
    where: {
      university_id: user.university_id,
      user_id: { not: userId },
    },
    select: {
      user_id: true,
      name: true,
      gender: true,
      gender_preference: true,
      campus_id: true,
      birthdate: true,
      min_age: true,
      max_age: true,
    },
  });

  console.log(`Found ${allProfiles.length} other profiles at same university\n`);

  if (allProfiles.length === 0) {
    console.log("❌ NO OTHER PROFILES AT SAME UNIVERSITY");
    return;
  }

  // Check each filter
  console.log("=== Filter Analysis ===\n");

  // 1. Campus filter
  const campusFiltered = allProfiles.filter(
    (p) => p.campus_id === user.campus_id
  );
  console.log(
    `1. Campus Filter (campus_id: ${user.campus_id}): ${campusFiltered.length}/${allProfiles.length} profiles`
  );
  if (user.campus_id && campusFiltered.length === 0) {
    console.log("   ❌ PROBLEM: No profiles match campus_id");
    console.log("   Other campus_ids:", [
      ...new Set(allProfiles.map((p) => p.campus_id)),
    ]);
  }

  // 2. Gender filter
  const allowedGenders = user.gender_preference.includes('All')
    ? ['Male', 'Female', 'Non-binary', 'Other']
    : genderPreferencesToIdentities(user.gender_preference);

  const genderFiltered = campusFiltered.filter((p) =>
    allowedGenders.includes(p.gender)
  );
  console.log(
    `2. Gender Filter (user wants: ${user.gender_preference} -> ${allowedGenders}): ${genderFiltered.length}/${campusFiltered.length} profiles`
  );
  if (genderFiltered.length === 0) {
    console.log("   ❌ PROBLEM: No profiles match gender preferences");
    console.log(
      "   Available genders:",
      [...new Set(campusFiltered.map((p) => p.gender))].join(", ")
    );
  }

  // 3. Age reciprocal filter
  const userAge = Math.floor(
    (Date.now() - user.birthdate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const ageFiltered = genderFiltered.filter(
    (p) => p.min_age <= userAge && p.max_age >= userAge
  );
  console.log(
    `\n3. Age Reciprocal Filter (candidates must want age ${userAge}): ${ageFiltered.length}/${genderFiltered.length} profiles`
  );

  console.log("\n=== Summary ===");
  console.log(`Started with: ${allProfiles.length} profiles`);
  console.log(`After campus filter: ${campusFiltered.length}`);
  console.log(`After gender filter (with mapping): ${genderFiltered.length}`);
  console.log(`After age reciprocal filter: ${ageFiltered.length}`);

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
