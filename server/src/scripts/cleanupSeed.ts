import { PrismaClient } from "@/generated/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const prisma = new PrismaClient();

async function main() {
  console.log("Start cleanup...");

  // Find all test users from both universities
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          email: {
            startsWith: "testuser",
            endsWith: "@njit.edu",
          },
        },
        {
          email: {
            startsWith: "testuser",
            endsWith: "@northeastern.edu",
          },
        },
      ],
    },
  });

  console.log(`Found ${users.length} test users to delete.`);

  for (const user of users) {
    console.log(`Deleting user: ${user.email} (${user.id})`);

    // 1. Delete from Supabase Storage
    try {
      const { data: files } = await supabaseAdmin.storage.from("profiles").list(user.id);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        const { error: storageError } = await supabaseAdmin.storage.from("profiles").remove(paths);
        if (storageError) {
          console.error(`Failed to delete storage for ${user.email}:`, storageError);
        } else {
          console.log(`Deleted storage for ${user.email}`);
        }
      }
    } catch (e) {
      console.error(`Error deleting storage for ${user.email}:`, e);
    }
  }

  // Bulk delete from Prisma
  await prisma.user.deleteMany({
    where: {
      OR: [
        {
          email: {
            startsWith: "testuser",
            endsWith: "@njit.edu",
          },
        },
        {
          email: {
            startsWith: "testuser",
            endsWith: "@northeastern.edu",
          },
        },
      ],
    },
  });

  console.log("Deleted users from Prisma.");

  console.log("Cleanup finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
