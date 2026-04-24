import * as fs from "node:fs";
import * as path from "node:path";
import * as bcrypt from "bcrypt";
import { GENDER_PREFERENCES } from "@/constants/genderPreferences";
import { INTENTS } from "@/constants/intents";
import { INTERESTS } from "@/constants/interests";
import {
  CAFFEINE,
  CANNABIS,
  CLEANLINESS,
  DIETARY_PREFERENCES,
  DRINKING,
  FITNESS,
  LIVING_SITUATION,
  PETS,
  SLEEP_HABITS,
  SMOKING,
  STUDY_STYLE,
} from "@/constants/lifestyleOptions";
import { MAJORS } from "@/constants/majors";
import { PRONOUNS } from "@/constants/pronouns";
import { SEXUAL_ORIENTATIONS } from "@/constants/sexualOrientations";
import prisma from "@/lib/prismaClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
login:
testuser{i}@njit.edu or testuser{i}@northeastern.edu
password123
*/

/**
 * Pick diverse interests for seed data from organized interests categories.
 * Each user gets 3 interests, selecting from different categories.
 * All users have at least 3 diverse interests to ensure a complete profile.
 */
function getInterestsForUser(userIndex: number): string[] {
  const categories = Object.values(INTERESTS);
  const selected: string[] = [];

  // Get one interest from each of the first 3 categories (cycling through if needed)
  for (let i = 0; i < 3; i++) {
    const categoryIdx = (userIndex + i) % categories.length;
    const category = categories[categoryIdx];
    const interestIdx = userIndex % category.length;
    selected.push(category[interestIdx]);
  }

  return selected;
}

/**
 * Get a random intent from the constants
 */
function getRandomIntent(userIndex: number): string {
  return INTENTS[userIndex % INTENTS.length];
}

/**
 * Get a random major from the constants
 */
function getRandomMajor(userIndex: number): string {
  return MAJORS[userIndex % MAJORS.length];
}

/**
 * Get random gender preferences from the constants
 */
function getRandomGenderPreferences(userIndex: number): string[] {
  const patterns = [
    [GENDER_PREFERENCES[0]], // Men
    [GENDER_PREFERENCES[1]], // Women
    [GENDER_PREFERENCES[2]], // Non-binary
    [GENDER_PREFERENCES[3]], // All
    [GENDER_PREFERENCES[0], GENDER_PREFERENCES[1]], // Men + Women
  ];
  return patterns[userIndex % patterns.length];
}

/**
 * Get a random sexual orientation from the constants
 */
function getRandomSexualOrientation(userIndex: number): string {
  return SEXUAL_ORIENTATIONS[userIndex % SEXUAL_ORIENTATIONS.length];
}

/**
 * Get a random pronoun from the constants
 */
function getRandomPronouns(userIndex: number): string {
  return PRONOUNS[userIndex % PRONOUNS.length];
}

/**
 * Generate diverse lifestyle data using modulo pattern for seeding.
 * Each user gets 3-8 random lifestyle fields filled out to simulate real user behavior
 * where not all users complete all lifestyle preferences.
 */
function getLifestyleForUser(userIndex: number): object {
  // All 11 lifestyle field keys
  const allFields = [
    "drinking",
    "smoking",
    "cannabis",
    "sleep_habits",
    "pets",
    "dietary_preferences",
    "study_style",
    "cleanliness",
    "caffeine",
    "living_situation",
    "fitness",
  ];

  // Randomly select 3-8 fields for this user (use userIndex for pseudo-randomness)
  const numFields = 3 + (userIndex % 6); // 3-8 fields
  const selectedFields = allFields.slice(
    userIndex % 11,
    (userIndex % 11) + numFields,
  );

  const lifestyle: any = {};

  if (selectedFields.includes("drinking")) {
    lifestyle.drinking = DRINKING[userIndex % DRINKING.length];
  }
  if (selectedFields.includes("smoking")) {
    lifestyle.smoking = SMOKING[userIndex % SMOKING.length];
  }
  if (selectedFields.includes("cannabis")) {
    lifestyle.cannabis = CANNABIS[userIndex % CANNABIS.length];
  }
  if (selectedFields.includes("sleep_habits")) {
    lifestyle.sleep_habits = SLEEP_HABITS[userIndex % SLEEP_HABITS.length];
  }
  if (selectedFields.includes("pets")) {
    lifestyle.pets = [PETS[userIndex % PETS.length]];
  }
  if (selectedFields.includes("dietary_preferences")) {
    lifestyle.dietary_preferences = [
      DIETARY_PREFERENCES[userIndex % DIETARY_PREFERENCES.length],
    ];
  }
  if (selectedFields.includes("study_style")) {
    lifestyle.study_style = STUDY_STYLE[userIndex % STUDY_STYLE.length];
  }
  if (selectedFields.includes("cleanliness")) {
    lifestyle.cleanliness = CLEANLINESS[userIndex % CLEANLINESS.length];
  }
  if (selectedFields.includes("caffeine")) {
    lifestyle.caffeine = CAFFEINE[userIndex % CAFFEINE.length];
  }
  if (selectedFields.includes("living_situation")) {
    lifestyle.living_situation =
      LIVING_SITUATION[userIndex % LIVING_SITUATION.length];
  }
  if (selectedFields.includes("fitness")) {
    lifestyle.fitness = FITNESS[userIndex % FITNESS.length];
  }

  return lifestyle;
}

const njitUsersData = [
  {
    email: "testuser1@njit.edu",
    name: "Alice Smith",
    birthdate: "2002-04-12",
    gender: "Female",
    pronouns: getRandomPronouns(0),
    bio: "Passionate about coding and fitness. Loves to explore new technologies.",
    university_year: 3,
    major: getRandomMajor(0),
    grad_year: 2025,
    interests: getInterestsForUser(0),
    intent: getRandomIntent(0),
    gender_preference: getRandomGenderPreferences(0),
    sexual_orientation: getRandomSexualOrientation(0),
    min_age: 20,
    max_age: 24,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(0),
  },
  {
    email: "testuser2@njit.edu",
    name: "Fiona Miller",
    birthdate: "2003-09-08",
    gender: "Female",
    pronouns: getRandomPronouns(1),
    bio: "Loves hiking and photography. Always up for a new adventure.",
    university_year: 2,
    major: getRandomMajor(1),
    grad_year: 2026,
    interests: getInterestsForUser(1),
    intent: getRandomIntent(1),
    gender_preference: getRandomGenderPreferences(1),
    sexual_orientation: getRandomSexualOrientation(1),
    min_age: 19,
    max_age: 23,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(1),
  },
  {
    email: "testuser3@njit.edu",
    name: "Michael Brown",
    birthdate: "2001-11-15",
    gender: "Male",
    pronouns: getRandomPronouns(2),
    bio: "Enjoys reading and photography. A creative soul.",
    university_year: 4,
    major: getRandomMajor(2),
    grad_year: 2024,
    interests: getInterestsForUser(2),
    intent: getRandomIntent(2),
    gender_preference: getRandomGenderPreferences(2),
    sexual_orientation: getRandomSexualOrientation(2),
    min_age: 21,
    max_age: 26,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(2),
  },
  {
    email: "testuser4@njit.edu",
    name: "Diana Prince",
    birthdate: "2004-03-02",
    gender: "Female",
    pronouns: getRandomPronouns(3),
    bio: "Fitness enthusiast and music lover. Always ready for an adventure.",
    university_year: 1,
    major: getRandomMajor(3),
    grad_year: 2027,
    interests: getInterestsForUser(3),
    intent: getRandomIntent(3),
    gender_preference: getRandomGenderPreferences(3),
    sexual_orientation: getRandomSexualOrientation(3),
    min_age: 18,
    max_age: 22,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(3),
  },
  {
    email: "testuser5@njit.edu",
    name: "Eve Adams",
    birthdate: "2002-07-04",
    gender: "Female",
    pronouns: getRandomPronouns(4),
    bio: "Loves to code and play games. Always learning something new.",
    university_year: 3,
    major: getRandomMajor(4),
    grad_year: 2025,
    interests: getInterestsForUser(4),
    intent: getRandomIntent(4),
    gender_preference: getRandomGenderPreferences(4),
    sexual_orientation: getRandomSexualOrientation(4),
    min_age: 20,
    max_age: 24,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(4),
  },
  {
    email: "testuser6@njit.edu",
    name: "Frank White",
    birthdate: "2001-05-21",
    gender: "Male",
    pronouns: getRandomPronouns(5),
    bio: "Photography hobbyist with a passion for music. Exploring creativity.",
    university_year: 4,
    major: getRandomMajor(5),
    grad_year: 2024,
    interests: getInterestsForUser(5),
    intent: getRandomIntent(5),
    gender_preference: getRandomGenderPreferences(5),
    sexual_orientation: getRandomSexualOrientation(5),
    min_age: 21,
    max_age: 26,
    avatarFile: "p6.jpeg",
    lifestyle: getLifestyleForUser(5),
  },
  {
    email: "testuser7@njit.edu",
    name: "Grace Lee",
    birthdate: "2003-08-30",
    gender: "Female",
    pronouns: getRandomPronouns(6),
    bio: "Enjoys reading and staying fit. A quiet but adventurous spirit.",
    university_year: 2,
    major: getRandomMajor(6),
    grad_year: 2026,
    interests: getInterestsForUser(6),
    intent: getRandomIntent(6),
    gender_preference: getRandomGenderPreferences(6),
    sexual_orientation: getRandomSexualOrientation(6),
    min_age: 19,
    max_age: 23,
    avatarFile: "p7.jpeg",
    lifestyle: getLifestyleForUser(6),
  },
  {
    email: "testuser8@njit.edu",
    name: "Henry Green",
    birthdate: "2004-02-12",
    gender: "Male",
    pronouns: getRandomPronouns(7),
    bio: "Gamer and tech enthusiast. Always up for a good conversation.",
    university_year: 1,
    major: getRandomMajor(7),
    grad_year: 2027,
    interests: getInterestsForUser(7),
    intent: getRandomIntent(7),
    gender_preference: getRandomGenderPreferences(7),
    sexual_orientation: getRandomSexualOrientation(7),
    min_age: 18,
    max_age: 22,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(7),
  },
  {
    email: "testuser9@njit.edu",
    name: "Ivy Chen",
    birthdate: "2002-12-12",
    gender: "Female",
    pronouns: getRandomPronouns(8),
    bio: "Music composer and artist. Expressing through sounds and visuals.",
    university_year: 3,
    major: getRandomMajor(8),
    grad_year: 2025,
    interests: getInterestsForUser(8),
    intent: getRandomIntent(8),
    gender_preference: getRandomGenderPreferences(8),
    sexual_orientation: getRandomSexualOrientation(8),
    min_age: 20,
    max_age: 24,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(8),
  },
  {
    email: "testuser10@njit.edu",
    name: "Jack Taylor",
    birthdate: "2000-06-30",
    gender: "Male",
    pronouns: getRandomPronouns(9),
    bio: "Fitness trainer and outdoor adventurer. Loves challenges.",
    university_year: 4,
    major: getRandomMajor(9),
    grad_year: 2024,
    interests: getInterestsForUser(9),
    intent: getRandomIntent(9),
    gender_preference: getRandomGenderPreferences(9),
    sexual_orientation: getRandomSexualOrientation(9),
    min_age: 21,
    max_age: 26,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(9),
  },
  // Edge cases and additional diversity
  {
    email: "testuser11@njit.edu",
    name: "Sarah Johnson",
    birthdate: "2003-01-15",
    gender: "Female",
    pronouns: getRandomPronouns(10),
    bio: "No interests listed - testing edge case.",
    university_year: 2,
    major: getRandomMajor(10),
    grad_year: 2026,
    interests: getInterestsForUser(10),
    intent: getRandomIntent(10),
    gender_preference: getRandomGenderPreferences(10),
    sexual_orientation: getRandomSexualOrientation(10),
    min_age: 19,
    max_age: 23,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(10),
  },
  {
    email: "testuser12@njit.edu",
    name: "James Wilson",
    birthdate: "2001-06-20",
    gender: "Male",
    pronouns: getRandomPronouns(11),
    bio: "Serious about finding a long-term partner.",
    university_year: 3,
    major: getRandomMajor(11),
    grad_year: 2025,
    interests: getInterestsForUser(11),
    intent: getRandomIntent(11),
    gender_preference: getRandomGenderPreferences(11),
    sexual_orientation: getRandomSexualOrientation(11),
    min_age: 20,
    max_age: 25,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(11),
  },
  {
    email: "testuser13@njit.edu",
    name: "Lisa Chen",
    birthdate: "2002-11-10",
    gender: "Female",
    pronouns: getRandomPronouns(12),
    bio: "Just here for casual fun, nothing serious.",
    university_year: 3,
    major: getRandomMajor(12),
    grad_year: 2025,
    interests: getInterestsForUser(12),
    intent: getRandomIntent(12),
    gender_preference: getRandomGenderPreferences(12),
    sexual_orientation: getRandomSexualOrientation(12),
    min_age: 21,
    max_age: 25,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(12),
  },
  {
    email: "testuser14@njit.edu",
    name: "Marcus Rodriguez",
    birthdate: "2002-03-25",
    gender: "Male",
    pronouns: getRandomPronouns(13),
    bio: "Looking for study buddies and academic friends.",
    university_year: 2,
    major: getRandomMajor(13),
    grad_year: 2026,
    interests: getInterestsForUser(13),
    intent: getRandomIntent(13),
    gender_preference: getRandomGenderPreferences(13),
    sexual_orientation: getRandomSexualOrientation(13),
    min_age: 19,
    max_age: 24,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser15@njit.edu",
    name: "Emma Davis",
    birthdate: "2001-09-30",
    gender: "Female",
    pronouns: getRandomPronouns(14),
    bio: "Open to anything, just seeing what's out there.",
    university_year: 4,
    major: getRandomMajor(14),
    grad_year: 2024,
    interests: getInterestsForUser(14),
    intent: getRandomIntent(14),
    gender_preference: getRandomGenderPreferences(14),
    sexual_orientation: getRandomSexualOrientation(14),
    min_age: 20,
    max_age: 26,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(14),
  },
  {
    email: "testuser16@njit.edu",
    name: "Noah Bennett",
    birthdate: "2003-07-12",
    gender: "Male",
    pronouns: getRandomPronouns(15),
    bio: "Into fitness and outdoor activities.",
    university_year: 1,
    major: getRandomMajor(15),
    grad_year: 2027,
    interests: getInterestsForUser(15),
    intent: getRandomIntent(15),
    gender_preference: getRandomGenderPreferences(15),
    sexual_orientation: getRandomSexualOrientation(15),
    min_age: 18,
    max_age: 22,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(15),
  },
  {
    email: "testuser17@njit.edu",
    name: "Rachel Green",
    birthdate: "2000-02-14",
    gender: "Female",
    pronouns: getRandomPronouns(16),
    bio: "Older student, back in school after time off.",
    university_year: 2,
    major: getRandomMajor(16),
    grad_year: 2026,
    interests: getInterestsForUser(16),
    intent: getRandomIntent(16),
    gender_preference: getRandomGenderPreferences(16),
    sexual_orientation: getRandomSexualOrientation(16),
    min_age: 23,
    max_age: 35,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(16),
  },
  {
    email: "testuser18@njit.edu",
    name: "David Kim",
    birthdate: "2004-05-08",
    gender: "Male",
    pronouns: getRandomPronouns(17),
    bio: "Younger student, interested in tech and music.",
    university_year: 1,
    major: getRandomMajor(17),
    grad_year: 2027,
    interests: getInterestsForUser(17),
    intent: getRandomIntent(17),
    gender_preference: getRandomGenderPreferences(17),
    sexual_orientation: getRandomSexualOrientation(17),
    min_age: 18,
    max_age: 21,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser19@njit.edu",
    name: "Jessica Martinez",
    birthdate: "2002-10-22",
    gender: "Female",
    pronouns: getRandomPronouns(18),
    bio: "Architecture student with creative interests.",
    university_year: 3,
    major: getRandomMajor(18),
    grad_year: 2025,
    interests: getInterestsForUser(18),
    intent: getRandomIntent(18),
    gender_preference: getRandomGenderPreferences(18),
    sexual_orientation: getRandomSexualOrientation(18),
    min_age: 20,
    max_age: 24,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser20@njit.edu",
    name: "Kevin Thompson",
    birthdate: "2001-12-03",
    gender: "Male",
    pronouns: getRandomPronouns(19),
    bio: "Mechanical engineer with diverse interests.",
    university_year: 4,
    major: getRandomMajor(19),
    grad_year: 2024,
    interests: getInterestsForUser(19),
    intent: getRandomIntent(19),
    gender_preference: getRandomGenderPreferences(19),
    sexual_orientation: getRandomSexualOrientation(19),
    min_age: 21,
    max_age: 26,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(19),
  },
  {
    email: "testuser21@njit.edu",
    name: "Sophia Anderson",
    birthdate: "2003-04-17",
    gender: "Female",
    pronouns: getRandomPronouns(20),
    bio: "Design student with passion for visual arts.",
    university_year: 2,
    major: getRandomMajor(20),
    grad_year: 2026,
    interests: getInterestsForUser(20),
    intent: getRandomIntent(20),
    gender_preference: getRandomGenderPreferences(20),
    sexual_orientation: getRandomSexualOrientation(20),
    min_age: 19,
    max_age: 23,
    avatarFile: "p7.jpeg",
    lifestyle: getLifestyleForUser(20),
  },
  {
    email: "testuser22@njit.edu",
    name: "Tyler Johnson",
    birthdate: "2002-08-28",
    gender: "Male",
    pronouns: getRandomPronouns(21),
    bio: "Business student looking to network and date.",
    university_year: 3,
    major: getRandomMajor(21),
    grad_year: 2025,
    interests: getInterestsForUser(21),
    intent: getRandomIntent(21),
    gender_preference: getRandomGenderPreferences(21),
    sexual_orientation: getRandomSexualOrientation(21),
    min_age: 20,
    max_age: 24,
    avatarFile: "p6.jpeg",
    lifestyle: getLifestyleForUser(21),
  },
  {
    email: "testuser23@njit.edu",
    name: "Olivia Taylor",
    birthdate: "2001-01-11",
    gender: "Female",
    pronouns: getRandomPronouns(22),
    bio: "CS major seeking serious relationship.",
    university_year: 4,
    major: getRandomMajor(22),
    grad_year: 2024,
    interests: getInterestsForUser(22),
    intent: getRandomIntent(22),
    gender_preference: getRandomGenderPreferences(22),
    sexual_orientation: getRandomSexualOrientation(22),
    min_age: 22,
    max_age: 27,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(22),
  },
  {
    email: "testuser24@njit.edu",
    name: "Christopher Lee",
    birthdate: "2003-11-05",
    gender: "Male",
    pronouns: getRandomPronouns(23),
    bio: "Freshman into gaming and tech.",
    university_year: 1,
    major: getRandomMajor(23),
    grad_year: 2027,
    interests: getInterestsForUser(23),
    intent: getRandomIntent(23),
    gender_preference: getRandomGenderPreferences(23),
    sexual_orientation: getRandomSexualOrientation(23),
    min_age: 18,
    max_age: 21,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(23),
  },
  {
    email: "testuser25@njit.edu",
    name: "Amanda White",
    birthdate: "2002-06-19",
    gender: "Female",
    pronouns: getRandomPronouns(24),
    bio: "Mechanical engineering student with broad interests.",
    university_year: 3,
    major: getRandomMajor(24),
    grad_year: 2025,
    interests: getInterestsForUser(24),
    intent: getRandomIntent(24),
    gender_preference: getRandomGenderPreferences(24),
    sexual_orientation: getRandomSexualOrientation(24),
    min_age: 20,
    max_age: 24,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(14),
  },
  {
    email: "testuser26@njit.edu",
    name: "Brandon Harris",
    birthdate: "2001-03-09",
    gender: "Male",
    pronouns: getRandomPronouns(25),
    bio: "Architecture student with creative flair.",
    university_year: 4,
    major: getRandomMajor(25),
    grad_year: 2024,
    interests: getInterestsForUser(25),
    intent: getRandomIntent(25),
    gender_preference: getRandomGenderPreferences(25),
    sexual_orientation: getRandomSexualOrientation(25),
    min_age: 21,
    max_age: 26,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(15),
  },
  {
    email: "testuser27@njit.edu",
    name: "Victoria Moore",
    birthdate: "2003-09-13",
    gender: "Female",
    pronouns: getRandomPronouns(26),
    bio: "Business major into fitness and music.",
    university_year: 2,
    major: getRandomMajor(26),
    grad_year: 2026,
    interests: getInterestsForUser(26),
    intent: getRandomIntent(26),
    gender_preference: getRandomGenderPreferences(26),
    sexual_orientation: getRandomSexualOrientation(26),
    min_age: 19,
    max_age: 23,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser28@njit.edu",
    name: "Andrew Jackson",
    birthdate: "2002-07-21",
    gender: "Male",
    pronouns: getRandomPronouns(27),
    bio: "Civil engineer seeking study buddy or more.",
    university_year: 3,
    major: getRandomMajor(27),
    grad_year: 2025,
    interests: getInterestsForUser(27),
    intent: getRandomIntent(27),
    gender_preference: getRandomGenderPreferences(27),
    sexual_orientation: getRandomSexualOrientation(27),
    min_age: 20,
    max_age: 24,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser29@njit.edu",
    name: "Nicole Scott",
    birthdate: "2001-10-06",
    gender: "Female",
    pronouns: getRandomPronouns(28),
    bio: "Design student with artistic spirit.",
    university_year: 4,
    major: getRandomMajor(28),
    grad_year: 2024,
    interests: getInterestsForUser(28),
    intent: getRandomIntent(28),
    gender_preference: getRandomGenderPreferences(28),
    sexual_orientation: getRandomSexualOrientation(28),
    min_age: 21,
    max_age: 26,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(16),
  },
  {
    email: "testuser30@njit.edu",
    name: "Matthew Edwards",
    birthdate: "2004-02-28",
    gender: "Male",
    pronouns: getRandomPronouns(29),
    bio: "IT student passionate about technology.",
    university_year: 1,
    major: getRandomMajor(29),
    grad_year: 2027,
    interests: getInterestsForUser(29),
    intent: getRandomIntent(29),
    gender_preference: getRandomGenderPreferences(29),
    sexual_orientation: getRandomSexualOrientation(29),
    min_age: 18,
    max_age: 21,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(23),
  },
];

const northeasternUsersData = [
  {
    email: "testuser1@northeastern.edu",
    name: "Alice Smith",
    birthdate: "2002-04-12",
    gender: "Female",
    pronouns: getRandomPronouns(30),
    bio: "Passionate about coding and fitness. Loves to explore new technologies.",
    university_year: 3,
    major: getRandomMajor(30),
    grad_year: 2025,
    interests: getInterestsForUser(30),
    intent: getRandomIntent(30),
    gender_preference: getRandomGenderPreferences(30),
    sexual_orientation: getRandomSexualOrientation(30),
    min_age: 20,
    max_age: 24,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(22),
  },
  {
    email: "testuser2@northeastern.edu",
    name: "Fiona Miller",
    birthdate: "2003-09-08",
    gender: "Female",
    pronouns: getRandomPronouns(31),
    bio: "Loves hiking and photography. Always up for a new adventure.",
    university_year: 2,
    major: getRandomMajor(31),
    grad_year: 2026,
    interests: getInterestsForUser(31),
    intent: getRandomIntent(31),
    gender_preference: getRandomGenderPreferences(31),
    sexual_orientation: getRandomSexualOrientation(31),
    min_age: 19,
    max_age: 23,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser3@northeastern.edu",
    name: "Michael Brown",
    birthdate: "2001-11-15",
    gender: "Male",
    pronouns: getRandomPronouns(32),
    bio: "Enjoys reading and photography. A creative soul.",
    university_year: 4,
    major: getRandomMajor(32),
    grad_year: 2024,
    interests: getInterestsForUser(32),
    intent: getRandomIntent(32),
    gender_preference: getRandomGenderPreferences(32),
    sexual_orientation: getRandomSexualOrientation(32),
    min_age: 21,
    max_age: 26,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(19),
  },
  {
    email: "testuser4@northeastern.edu",
    name: "Diana Prince",
    birthdate: "2004-03-02",
    gender: "Female",
    pronouns: getRandomPronouns(33),
    bio: "Fitness enthusiast and music lover. Always ready for an adventure.",
    university_year: 1,
    major: getRandomMajor(33),
    grad_year: 2027,
    interests: getInterestsForUser(33),
    intent: getRandomIntent(33),
    gender_preference: getRandomGenderPreferences(33),
    sexual_orientation: getRandomSexualOrientation(33),
    min_age: 18,
    max_age: 22,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(14),
  },
  {
    email: "testuser5@northeastern.edu",
    name: "Eve Adams",
    birthdate: "2002-07-04",
    gender: "Female",
    pronouns: getRandomPronouns(34),
    bio: "Loves to code and play games. Always learning something new.",
    university_year: 3,
    major: getRandomMajor(34),
    grad_year: 2025,
    interests: getInterestsForUser(34),
    intent: getRandomIntent(34),
    gender_preference: getRandomGenderPreferences(34),
    sexual_orientation: getRandomSexualOrientation(34),
    min_age: 20,
    max_age: 24,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(16),
  },
  {
    email: "testuser6@northeastern.edu",
    name: "Frank White",
    birthdate: "2001-05-21",
    gender: "Male",
    pronouns: getRandomPronouns(35),
    bio: "Photography hobbyist with a passion for music. Exploring creativity.",
    university_year: 4,
    major: getRandomMajor(35),
    grad_year: 2024,
    interests: getInterestsForUser(35),
    intent: getRandomIntent(35),
    gender_preference: getRandomGenderPreferences(35),
    sexual_orientation: getRandomSexualOrientation(35),
    min_age: 21,
    max_age: 26,
    avatarFile: "p6.jpeg",
    lifestyle: getLifestyleForUser(21),
  },
  {
    email: "testuser7@northeastern.edu",
    name: "Grace Lee",
    birthdate: "2003-08-30",
    gender: "Female",
    pronouns: getRandomPronouns(36),
    bio: "Enjoys reading and staying fit. A quiet but adventurous spirit.",
    university_year: 2,
    major: getRandomMajor(36),
    grad_year: 2026,
    interests: getInterestsForUser(36),
    intent: getRandomIntent(36),
    gender_preference: getRandomGenderPreferences(36),
    sexual_orientation: getRandomSexualOrientation(36),
    min_age: 19,
    max_age: 23,
    avatarFile: "p7.jpeg",
    lifestyle: getLifestyleForUser(20),
  },
  {
    email: "testuser8@northeastern.edu",
    name: "Henry Green",
    birthdate: "2004-02-12",
    gender: "Male",
    pronouns: getRandomPronouns(37),
    bio: "Gamer and tech enthusiast. Always up for a good conversation.",
    university_year: 1,
    major: getRandomMajor(37),
    grad_year: 2027,
    interests: getInterestsForUser(37),
    intent: getRandomIntent(37),
    gender_preference: getRandomGenderPreferences(37),
    sexual_orientation: getRandomSexualOrientation(37),
    min_age: 18,
    max_age: 22,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser9@northeastern.edu",
    name: "Ivy Chen",
    birthdate: "2002-12-12",
    gender: "Female",
    pronouns: getRandomPronouns(38),
    bio: "Music composer and artist. Expressing through sounds and visuals.",
    university_year: 3,
    major: getRandomMajor(38),
    grad_year: 2025,
    interests: getInterestsForUser(38),
    intent: getRandomIntent(38),
    gender_preference: getRandomGenderPreferences(38),
    sexual_orientation: getRandomSexualOrientation(38),
    min_age: 20,
    max_age: 24,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(23),
  },
  {
    email: "testuser10@northeastern.edu",
    name: "Jack Taylor",
    birthdate: "2000-06-30",
    gender: "Male",
    pronouns: getRandomPronouns(39),
    bio: "Fitness trainer and outdoor adventurer. Loves challenges.",
    university_year: 4,
    major: getRandomMajor(39),
    grad_year: 2024,
    interests: getInterestsForUser(39),
    intent: getRandomIntent(39),
    gender_preference: getRandomGenderPreferences(39),
    sexual_orientation: getRandomSexualOrientation(39),
    min_age: 21,
    max_age: 26,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(15),
  },
  // Edge cases and additional diversity
  {
    email: "testuser11@northeastern.edu",
    name: "Sarah Johnson",
    birthdate: "2003-01-15",
    gender: "Female",
    pronouns: getRandomPronouns(40),
    bio: "No interests listed - testing edge case.",
    university_year: 2,
    major: getRandomMajor(40),
    grad_year: 2026,
    interests: getInterestsForUser(40),
    intent: getRandomIntent(40),
    gender_preference: getRandomGenderPreferences(40),
    sexual_orientation: getRandomSexualOrientation(40),
    min_age: 19,
    max_age: 23,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(22),
  },
  {
    email: "testuser12@northeastern.edu",
    name: "James Wilson",
    birthdate: "2001-06-20",
    gender: "Male",
    pronouns: getRandomPronouns(41),
    bio: "Serious about finding a long-term partner.",
    university_year: 3,
    major: getRandomMajor(41),
    grad_year: 2025,
    interests: getInterestsForUser(41),
    intent: getRandomIntent(41),
    gender_preference: getRandomGenderPreferences(41),
    sexual_orientation: getRandomSexualOrientation(41),
    min_age: 20,
    max_age: 25,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(19),
  },
  {
    email: "testuser13@northeastern.edu",
    name: "Lisa Chen",
    birthdate: "2002-11-10",
    gender: "Female",
    pronouns: getRandomPronouns(42),
    bio: "Just here for casual fun, nothing serious.",
    university_year: 3,
    major: getRandomMajor(42),
    grad_year: 2025,
    interests: getInterestsForUser(42),
    intent: getRandomIntent(42),
    gender_preference: getRandomGenderPreferences(42),
    sexual_orientation: getRandomSexualOrientation(42),
    min_age: 21,
    max_age: 25,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser14@northeastern.edu",
    name: "Marcus Rodriguez",
    birthdate: "2002-03-25",
    gender: "Male",
    pronouns: getRandomPronouns(43),
    bio: "Looking for study buddies and academic friends.",
    university_year: 2,
    major: getRandomMajor(43),
    grad_year: 2026,
    interests: getInterestsForUser(43),
    intent: getRandomIntent(43),
    gender_preference: getRandomGenderPreferences(43),
    sexual_orientation: getRandomSexualOrientation(43),
    min_age: 19,
    max_age: 24,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser15@northeastern.edu",
    name: "Emma Davis",
    birthdate: "2001-09-30",
    gender: "Female",
    pronouns: getRandomPronouns(44),
    bio: "Open to anything, just seeing what's out there.",
    university_year: 4,
    major: getRandomMajor(44),
    grad_year: 2024,
    interests: getInterestsForUser(44),
    intent: getRandomIntent(44),
    gender_preference: getRandomGenderPreferences(44),
    sexual_orientation: getRandomSexualOrientation(44),
    min_age: 20,
    max_age: 26,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(14),
  },
  {
    email: "testuser16@northeastern.edu",
    name: "Noah Bennett",
    birthdate: "2003-07-12",
    gender: "Male",
    pronouns: getRandomPronouns(45),
    bio: "Into fitness and outdoor activities.",
    university_year: 1,
    major: getRandomMajor(45),
    grad_year: 2027,
    interests: getInterestsForUser(45),
    intent: getRandomIntent(45),
    gender_preference: getRandomGenderPreferences(45),
    sexual_orientation: getRandomSexualOrientation(45),
    min_age: 18,
    max_age: 22,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(15),
  },
  {
    email: "testuser17@northeastern.edu",
    name: "Rachel Green",
    birthdate: "2000-02-14",
    gender: "Female",
    pronouns: getRandomPronouns(46),
    bio: "Older student, back in school after time off.",
    university_year: 2,
    major: getRandomMajor(46),
    grad_year: 2026,
    interests: getInterestsForUser(46),
    intent: getRandomIntent(46),
    gender_preference: getRandomGenderPreferences(46),
    sexual_orientation: getRandomSexualOrientation(46),
    min_age: 23,
    max_age: 35,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(16),
  },
  {
    email: "testuser18@northeastern.edu",
    name: "David Kim",
    birthdate: "2004-05-08",
    gender: "Male",
    pronouns: getRandomPronouns(47),
    bio: "Younger student, interested in tech and music.",
    university_year: 1,
    major: getRandomMajor(47),
    grad_year: 2027,
    interests: getInterestsForUser(47),
    intent: getRandomIntent(47),
    gender_preference: getRandomGenderPreferences(47),
    sexual_orientation: getRandomSexualOrientation(47),
    min_age: 18,
    max_age: 21,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser19@northeastern.edu",
    name: "Jessica Martinez",
    birthdate: "2002-10-22",
    gender: "Female",
    pronouns: getRandomPronouns(48),
    bio: "Architecture student with creative interests.",
    university_year: 3,
    major: getRandomMajor(48),
    grad_year: 2025,
    interests: getInterestsForUser(48),
    intent: getRandomIntent(48),
    gender_preference: getRandomGenderPreferences(48),
    sexual_orientation: getRandomSexualOrientation(48),
    min_age: 20,
    max_age: 24,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser20@northeastern.edu",
    name: "Kevin Thompson",
    birthdate: "2001-12-03",
    gender: "Male",
    pronouns: getRandomPronouns(49),
    bio: "Mechanical engineer with diverse interests.",
    university_year: 4,
    major: getRandomMajor(49),
    grad_year: 2024,
    interests: getInterestsForUser(49),
    intent: getRandomIntent(49),
    gender_preference: getRandomGenderPreferences(49),
    sexual_orientation: getRandomSexualOrientation(49),
    min_age: 21,
    max_age: 26,
    avatarFile: "p3.jpeg",
    lifestyle: getLifestyleForUser(19),
  },
  {
    email: "testuser21@northeastern.edu",
    name: "Sophia Anderson",
    birthdate: "2003-04-17",
    gender: "Female",
    pronouns: getRandomPronouns(50),
    bio: "Design student with passion for visual arts.",
    university_year: 2,
    major: getRandomMajor(50),
    grad_year: 2026,
    interests: getInterestsForUser(50),
    intent: getRandomIntent(50),
    gender_preference: getRandomGenderPreferences(50),
    sexual_orientation: getRandomSexualOrientation(50),
    min_age: 19,
    max_age: 23,
    avatarFile: "p7.jpeg",
    lifestyle: getLifestyleForUser(20),
  },
  {
    email: "testuser22@northeastern.edu",
    name: "Tyler Johnson",
    birthdate: "2002-08-28",
    gender: "Male",
    pronouns: getRandomPronouns(51),
    bio: "Business student looking to network and date.",
    university_year: 3,
    major: getRandomMajor(51),
    grad_year: 2025,
    interests: getInterestsForUser(51),
    intent: getRandomIntent(51),
    gender_preference: getRandomGenderPreferences(51),
    sexual_orientation: getRandomSexualOrientation(51),
    min_age: 20,
    max_age: 24,
    avatarFile: "p6.jpeg",
    lifestyle: getLifestyleForUser(21),
  },
  {
    email: "testuser23@northeastern.edu",
    name: "Olivia Taylor",
    birthdate: "2001-01-11",
    gender: "Female",
    pronouns: getRandomPronouns(52),
    bio: "CS major seeking serious relationship.",
    university_year: 4,
    major: getRandomMajor(52),
    grad_year: 2024,
    interests: getInterestsForUser(52),
    intent: getRandomIntent(52),
    gender_preference: getRandomGenderPreferences(52),
    sexual_orientation: getRandomSexualOrientation(52),
    min_age: 22,
    max_age: 27,
    avatarFile: "p1.jpeg",
    lifestyle: getLifestyleForUser(22),
  },
  {
    email: "testuser24@northeastern.edu",
    name: "Christopher Lee",
    birthdate: "2003-11-05",
    gender: "Male",
    pronouns: getRandomPronouns(53),
    bio: "Freshman into gaming and tech.",
    university_year: 1,
    major: getRandomMajor(53),
    grad_year: 2027,
    interests: getInterestsForUser(53),
    intent: getRandomIntent(53),
    gender_preference: getRandomGenderPreferences(53),
    sexual_orientation: getRandomSexualOrientation(53),
    min_age: 18,
    max_age: 21,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(23),
  },
  {
    email: "testuser25@northeastern.edu",
    name: "Amanda White",
    birthdate: "2002-06-19",
    gender: "Female",
    pronouns: getRandomPronouns(54),
    bio: "Mechanical engineering student with broad interests.",
    university_year: 3,
    major: getRandomMajor(54),
    grad_year: 2025,
    interests: getInterestsForUser(54),
    intent: getRandomIntent(54),
    gender_preference: getRandomGenderPreferences(54),
    sexual_orientation: getRandomSexualOrientation(54),
    min_age: 20,
    max_age: 24,
    avatarFile: "p4.jpeg",
    lifestyle: getLifestyleForUser(14),
  },
  {
    email: "testuser26@northeastern.edu",
    name: "Brandon Harris",
    birthdate: "2001-03-09",
    gender: "Male",
    pronouns: getRandomPronouns(55),
    bio: "Architecture student with creative flair.",
    university_year: 4,
    major: getRandomMajor(55),
    grad_year: 2024,
    interests: getInterestsForUser(55),
    intent: getRandomIntent(55),
    gender_preference: getRandomGenderPreferences(55),
    sexual_orientation: getRandomSexualOrientation(55),
    min_age: 21,
    max_age: 26,
    avatarFile: "p10.jpeg",
    lifestyle: getLifestyleForUser(15),
  },
  {
    email: "testuser27@northeastern.edu",
    name: "Victoria Moore",
    birthdate: "2003-09-13",
    gender: "Female",
    pronouns: getRandomPronouns(56),
    bio: "Business major into fitness and music.",
    university_year: 2,
    major: getRandomMajor(56),
    grad_year: 2026,
    interests: getInterestsForUser(56),
    intent: getRandomIntent(56),
    gender_preference: getRandomGenderPreferences(56),
    sexual_orientation: getRandomSexualOrientation(56),
    min_age: 19,
    max_age: 23,
    avatarFile: "p2.jpeg",
    lifestyle: getLifestyleForUser(18),
  },
  {
    email: "testuser28@northeastern.edu",
    name: "Andrew Jackson",
    birthdate: "2002-07-21",
    gender: "Male",
    pronouns: getRandomPronouns(57),
    bio: "Civil engineer seeking study buddy or more.",
    university_year: 3,
    major: getRandomMajor(57),
    grad_year: 2025,
    interests: getInterestsForUser(57),
    intent: getRandomIntent(57),
    gender_preference: getRandomGenderPreferences(57),
    sexual_orientation: getRandomSexualOrientation(57),
    min_age: 20,
    max_age: 24,
    avatarFile: "p8.jpeg",
    lifestyle: getLifestyleForUser(13),
  },
  {
    email: "testuser29@northeastern.edu",
    name: "Nicole Scott",
    birthdate: "2001-10-06",
    gender: "Female",
    pronouns: getRandomPronouns(58),
    bio: "Design student with artistic spirit.",
    university_year: 4,
    major: getRandomMajor(58),
    grad_year: 2024,
    interests: getInterestsForUser(58),
    intent: getRandomIntent(58),
    gender_preference: getRandomGenderPreferences(58),
    sexual_orientation: getRandomSexualOrientation(58),
    min_age: 21,
    max_age: 26,
    avatarFile: "p5.jpeg",
    lifestyle: getLifestyleForUser(16),
  },
  {
    email: "testuser30@northeastern.edu",
    name: "Matthew Edwards",
    birthdate: "2004-02-28",
    gender: "Male",
    pronouns: getRandomPronouns(59),
    bio: "IT student passionate about technology.",
    university_year: 1,
    major: getRandomMajor(59),
    grad_year: 2027,
    interests: getInterestsForUser(59),
    intent: getRandomIntent(59),
    gender_preference: getRandomGenderPreferences(59),
    sexual_orientation: getRandomSexualOrientation(59),
    min_age: 18,
    max_age: 21,
    avatarFile: "p9.jpeg",
    lifestyle: getLifestyleForUser(23),
  },
];

async function uploadFile(
  userId: string,
  localPath: string,
  targetFilename: string,
): Promise<string> {
  try {
    const fileContent = fs.readFileSync(localPath);
    const filePath = `${userId}/${targetFilename}`;

    // Remove existing file if any (though for seed we might not need to, but good practice)
    await supabaseAdmin.storage.from("profiles").remove([filePath]);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profiles")
      .upload(filePath, fileContent, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload file for ${userId}:`, uploadError);
      throw uploadError;
    }

    const { data } = supabaseAdmin.storage
      .from("profiles")
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error uploading file for ${userId}:`, error);
    // Fallback to a default or dicebear if upload fails
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  }
}

async function seedUniversity(universityData: any, usersData: any[]) {
  const passwordHash = await bcrypt.hash("password123", 12);

  const avatarsDir = path.join(__dirname, "..", "sample_avatars");
  const avatarFiles = fs
    .readdirSync(avatarsDir)
    .filter((f) => f.endsWith(".jpeg") || f.endsWith(".jpg"));

  const photosDir = path.join(__dirname, "..", "sample_photos");
  const photoFiles = fs
    .readdirSync(photosDir)
    .filter((f) => f.endsWith(".jpeg") || f.endsWith(".jpg"));

  if (avatarFiles.length === 0) {
    console.warn("No sample avatars found in sample_avatars directory!");
  }
  if (photoFiles.length === 0) {
    console.warn("No sample photos found in sample_photos directory!");
  }

  // Ensure university exists
  const university = await prisma.universities.upsert({
    where: { slug: universityData.slug },
    update: {},
    create: {
      name: universityData.name,
      slug: universityData.slug,
      university_domains: {
        create: { domain: universityData.domain },
      },
    },
  });

  console.log(`University: ${university.name} (${university.id})`);

  // Check existing users in one query instead of per-user
  const existingEmails = new Set(
    (
      await prisma.user.findMany({
        where: {
          email: {
            in: usersData.map((u) => u.email),
          },
        },
        select: { email: true },
      })
    ).map((u) => u.email),
  );

  const usersToCreate = usersData.filter((u) => !existingEmails.has(u.email));

  if (usersToCreate.length === 0) {
    console.log("All users already exist, skipping...");
    return;
  }

  // Helper for batched parallel operations with concurrency limit
  const batchedMap = async <T, U>(
    items: T[],
    fn: (item: T, index: number) => Promise<U>,
    concurrency: number = 5,
  ): Promise<U[]> => {
    const results: U[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((item, idx) => fn(item, i + idx)),
      );
      results.push(...batchResults);
    }
    return results;
  };

  // Step 1: Create all users with concurrency limit
  const createdUsers = await batchedMap(
    usersToCreate,
    (userData) =>
      prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          accounts: {
            create: {
              providerId: "credential",
              accountId: userData.email,
              password: passwordHash,
            },
          },
        },
      }),
    5, // Process 5 users at a time
  );

  // Step 2: Upload avatars and photos in parallel
  const uploadedData = await batchedMap(
    createdUsers.map((user, index) => ({ user, index })),
    async ({ user, index }) => {
      const userData = usersToCreate[index];

      // 1. Upload Avatar
      let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`;
      if (userData.avatarFile) {
        const specificAvatarPath = path.join(avatarsDir, userData.avatarFile);
        if (fs.existsSync(specificAvatarPath)) {
          try {
            avatarUrl = await uploadFile(
              user.id,
              specificAvatarPath,
              "avatar.jpeg",
            );
          } catch {
            console.warn(
              `Failed to upload avatar for ${userData.name}, using default.`,
            );
          }
        } else {
          console.warn(
            `Avatar file ${userData.avatarFile} not found for user ${userData.name}.`,
          );
        }
      }

      // 2. Select and Upload 6 Random Photos
      const profilePhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        // Shuffle and pick 6
        const shuffled = [...photoFiles].sort(() => 0.5 - Math.random());
        const selectedPhotos = shuffled.slice(0, 6);

        for (let i = 0; i < selectedPhotos.length; i++) {
          const photoFile = selectedPhotos[i];
          const photoPath = path.join(photosDir, photoFile);
          try {
            const photoUrl = await uploadFile(
              user.id,
              photoPath,
              `photo_${i}.jpg`,
            );
            profilePhotoUrls.push(photoUrl);
          } catch (e) {
            console.warn(
              `Failed to upload photo ${photoFile} for ${userData.name}:`,
              e,
            );
          }
        }
      }

      return { user, avatarUrl, profilePhotoUrls, userData };
    },
    5, // Process 5 users (uploads) at a time
  );

  // Step 3: Create all profiles with concurrency limit
  await batchedMap(
    uploadedData,
    ({ user, avatarUrl, profilePhotoUrls, userData }) =>
      prisma.profiles.create({
        data: {
          user_id: user.id,
          name: userData.name,
          avatar_url: avatarUrl,
          birthdate: new Date(userData.birthdate),
          gender: userData.gender,
          pronouns: userData.pronouns,
          bio: userData.bio,
          university_year: userData.university_year,
          major: userData.major,
          grad_year: userData.grad_year,
          interests: userData.interests,
          intent: userData.intent,
          gender_preference: userData.gender_preference,
          sexual_orientation: userData.sexual_orientation,
          min_age: userData.min_age,
          max_age: userData.max_age,
          university_id: university.id,
          lifestyle: userData.lifestyle || null,
          photos: profilePhotoUrls,
        },
      }),
    5, // Process 5 profiles at a time
  );

  console.log(`Created ${createdUsers.length} users for ${university.name}`);
}

async function main() {
  console.log("Start seeding...");

  // Seed both universities in parallel
  await Promise.all([
    seedUniversity(
      {
        name: "New Jersey Institute of Technology",
        slug: "njit",
        domain: "njit.edu",
      },
      njitUsersData,
    ),
    seedUniversity(
      {
        name: "Northeastern University",
        slug: "northeastern",
        domain: "northeastern.edu",
      },
      northeasternUsersData,
    ),
  ]);

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
