import { PrismaClient } from "../src/generated/prisma";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { supabaseAdmin } from "../src/lib/supabaseAdmin";

/*
login: 
testuser{i}@njit.edu
password123
*/
const prisma = new PrismaClient();

const usersData = [
  {
    email: "testuser1@njit.edu",
    name: "Alice Smith",
    birthdate: "2002-04-12",
    gender: "Female",
    pronouns: "she/her",
    bio: "Passionate about coding and fitness. Loves to explore new technologies.",
    university_year: 3,
    major: "Computer Science",
    grad_year: 2025,
    interests: ["Coding", "Fitness", "Reading"],
    intent: "Dating",
    gender_preference: ["Male"],
    sexual_orientation: "Heterosexual",
    min_age: 20,
    max_age: 24,
    avatarFile: "p1.jpeg",
  },
  {
    email: "testuser2@njit.edu",
    name: "Fiona Miller",
    birthdate: "2003-09-08",
    gender: "Female",
    pronouns: "she/her",
    bio: "Loves hiking and photography. Always up for a new adventure.",
    university_year: 2,
    major: "Design",
    grad_year: 2026,
    interests: ["Photography", "Travel", "Fitness"],
    intent: "Friendship",
    gender_preference: ["All"],
    sexual_orientation: "Bisexual",
    min_age: 19,
    max_age: 23,
    avatarFile: "p2.jpeg",
  },
  {
    email: "testuser3@njit.edu",
    name: "Michael Brown",
    birthdate: "2001-11-15",
    gender: "Male",
    pronouns: "he/him",
    bio: "Enjoys reading and photography. A creative soul.",
    university_year: 4,
    major: "Mechanical Engineering",
    grad_year: 2024,
    interests: ["Reading", "Photography", "Gaming"],
    intent: "Dating",
    gender_preference: ["Female"],
    sexual_orientation: "Bisexual",
    min_age: 21,
    max_age: 26,
    avatarFile: "p3.jpeg",
  },
  {
    email: "testuser4@njit.edu",
    name: "Diana Prince",
    birthdate: "2004-03-02",
    gender: "Female",
    pronouns: "she/her",
    bio: "Fitness enthusiast and music lover. Always ready for an adventure.",
    university_year: 1,
    major: "Civil Engineering",
    grad_year: 2027,
    interests: ["Fitness", "Music", "Photography"],
    intent: "Dating",
    gender_preference: ["All"],
    sexual_orientation: "Heterosexual",
    min_age: 18,
    max_age: 22,
    avatarFile: "p4.jpeg",
  },
  {
    email: "testuser5@njit.edu",
    name: "Eve Adams",
    birthdate: "2002-07-04",
    gender: "Female",
    pronouns: "she/her",
    bio: "Loves to code and play games. Always learning something new.",
    university_year: 3,
    major: "Business",
    grad_year: 2025,
    interests: ["Coding", "Gaming", "Fitness"],
    intent: "Friendship",
    gender_preference: ["Male", "Female"],
    sexual_orientation: "Lesbian",
    min_age: 20,
    max_age: 24,
    avatarFile: "p5.jpeg",
  },
  {
    email: "testuser6@njit.edu",
    name: "Frank White",
    birthdate: "2001-05-21",
    gender: "Male",
    pronouns: "he/him",
    bio: "Photography hobbyist with a passion for music. Exploring creativity.",
    university_year: 4,
    major: "Architecture",
    grad_year: 2024,
    interests: ["Photography", "Music", "Reading"],
    intent: "Dating",
    gender_preference: ["Female"],
    sexual_orientation: "Heterosexual",
    min_age: 21,
    max_age: 26,
    avatarFile: "p6.jpeg",
  },
  {
    email: "testuser7@njit.edu",
    name: "Grace Lee",
    birthdate: "2003-08-30",
    gender: "Female",
    pronouns: "she/her",
    bio: "Enjoys reading and staying fit. A quiet but adventurous spirit.",
    university_year: 2,
    major: "Computer Science",
    grad_year: 2026,
    interests: ["Reading", "Fitness", "Coding"],
    intent: "Friendship",
    gender_preference: ["Male"],
    sexual_orientation: "Heterosexual",
    min_age: 19,
    max_age: 23,
    avatarFile: "p7.jpeg",
  },
  {
    email: "testuser8@njit.edu",
    name: "Henry Green",
    birthdate: "2004-02-12",
    gender: "Male",
    pronouns: "he/him",
    bio: "Gamer and tech enthusiast. Always up for a good conversation.",
    university_year: 1,
    major: "Information Technology",
    grad_year: 2027,
    interests: ["Gaming", "Coding", "Music"],
    intent: "Dating",
    gender_preference: ["All"],
    sexual_orientation: "Gay",
    min_age: 18,
    max_age: 22,
    avatarFile: "p8.jpeg",
  },
  {
    email: "testuser9@njit.edu",
    name: "Ivy Chen",
    birthdate: "2002-12-12",
    gender: "Female",
    pronouns: "she/her",
    bio: "Music composer and artist. Expressing through sounds and visuals.",
    university_year: 3,
    major: "Mechanical Engineering",
    grad_year: 2025,
    interests: ["Music", "Photography", "Reading"],
    intent: "Friendship",
    gender_preference: ["Male"],
    sexual_orientation: "Heterosexual",
    min_age: 20,
    max_age: 24,
    avatarFile: "p9.jpeg",
  },
  {
    email: "testuser10@njit.edu",
    name: "Jack Taylor",
    birthdate: "2000-06-30",
    gender: "Male",
    pronouns: "he/him",
    bio: "Fitness trainer and outdoor adventurer. Loves challenges.",
    university_year: 4,
    major: "Civil Engineering",
    grad_year: 2024,
    interests: ["Fitness", "Gaming", "Music"],
    intent: "Dating",
    gender_preference: ["Female"],
    sexual_orientation: "Heterosexual",
    min_age: 21,
    max_age: 26,
    avatarFile: "p10.jpeg",
  },
];

async function uploadAvatar(userId: string, avatarPath: string): Promise<string> {
  try {
    const fileContent = fs.readFileSync(avatarPath);
    const fileName = `avatar.jpeg`;
    const filePath = `${userId}/${fileName}`;

    // Remove existing file if any (though for seed we might not need to, but good practice)
    await supabaseAdmin.storage.from("profiles").remove([filePath]);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profiles")
      .upload(filePath, fileContent, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload avatar for ${userId}:`, uploadError);
      throw uploadError;
    }

    const { data } = supabaseAdmin.storage.from("profiles").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error uploading avatar for ${userId}:`, error);
    // Fallback to a default or dicebear if upload fails, but for this task we want to use the samples
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`; 
  }
}

async function main() {
  console.log("Start seeding...");

  // Ensure NJIT exists
  const njit = await prisma.universities.upsert({
    where: { slug: "njit" },
    update: {},
    create: {
      name: "New Jersey Institute of Technology",
      slug: "njit",
      university_domains: {
        create: { domain: "njit.edu" },
      },
    },
  });

  console.log(`University: ${njit.name} (${njit.id})`);

  const passwordHash = await bcrypt.hash("password123", 12);
  
  const avatarsDir = path.join(__dirname, "sample_avatars");
  const avatarFiles = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg'));

  if (avatarFiles.length === 0) {
    console.warn("No sample avatars found in sample_avatars directory!");
  }

  for (const userData of usersData) {
    const { email, name, birthdate, gender, pronouns, bio, university_year, major, grad_year, interests, intent, gender_preference, sexual_orientation, min_age, max_age, avatarFile } = userData;
    
    // Check if user exists to avoid unique constraint errors on re-runs
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`User ${email} already exists, skipping...`);
      continue;
    }

    // Create user in Prisma first to get the ID
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        accounts: {
          create: {
            providerId: "credential",
            accountId: email,
            password: passwordHash,
          },
        },
      },
    });

    // Upload Avatar
    let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
    if (avatarFile) {
      const specificAvatarPath = path.join(avatarsDir, avatarFile);
      if (fs.existsSync(specificAvatarPath)) {
        avatarUrl = await uploadAvatar(user.id, specificAvatarPath);
      } else {
        console.warn(`Avatar file ${avatarFile} not found for user ${name}. Using default Dicebear avatar.`);
      }
    }

    // Create Profile
    await prisma.profiles.create({
      data: {
        user_id: user.id,
        name,
        avatar_url: avatarUrl,
        birthdate: new Date(birthdate),
        gender,
        pronouns,
        bio,
        university_year,
        major,
        grad_year,
        interests,
        intent,
        gender_preference,
        sexual_orientation,
        min_age,
        max_age,
        university_id: njit.id,
      },
    });

    console.log(`Created user: ${user.email}`);
  }

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
