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

const INTERESTS = [
  "Coding",
  "Gaming",
  "Music",
  "Reading",
  "Photography",
  "Fitness",
];

const MAJORS = [
  "Computer Science",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business",
  "Architecture",
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

  for (let i = 1; i <= 10; i++) {
    const email = `testuser${i}@njit.edu`;
    const name = `Test User ${i}`;
    
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
    if (avatarFiles.length > 0) {
      const randomAvatarFile = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
      const avatarPath = path.join(avatarsDir, randomAvatarFile);
      avatarUrl = await uploadAvatar(user.id, avatarPath);
    }

    // Create Profile
    await prisma.profiles.create({
      data: {
        user_id: user.id,
        name,
        avatar_url: avatarUrl,
        birthdate: new Date("2000-01-01"),
        gender: i % 2 === 0 ? "Male" : "Female",
        pronouns: i % 2 === 0 ? "he/him" : "she/her",
        bio: `I am test user ${i} from NJIT. I love ${INTERESTS[i % INTERESTS.length]}.`,
        university_year: (i % 4) + 1,
        major: MAJORS[i % MAJORS.length],
        grad_year: 2024 + (i % 4),
        interests: [
          INTERESTS[i % INTERESTS.length],
          INTERESTS[(i + 1) % INTERESTS.length],
          INTERESTS[(i + 2) % INTERESTS.length],
        ],
        intent: "Friendship",
        gender_preference: ["Male", "Female"],
        sexual_orientation: "Heterosexual",
        min_age: 18,
        max_age: 25,
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
