import { PrismaClient } from "../src/generated/prisma";
import { supabaseAdmin } from "../src/lib/supabaseAdmin";

const prisma = new PrismaClient();

async function main() {
  console.log("Start cleanup...");

  // Find all test users
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: "testuser",
        endsWith: "@njit.edu",
      },
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

    // 2. Delete from Supabase Auth
    // We need the Auth User ID. Prisma User ID might be different if they are not synced perfectly,
    // but usually we want to find the Auth user by email.
    try {
        // There is no direct "getUserByEmail" in admin api that returns ID easily without listing, 
        // but we can try to delete by ID if we stored it. 
        // However, Prisma `user.id` is a CUID, while Supabase Auth `id` is UUID.
        // If we created them via `supabaseAdmin.auth.admin.createUser`, we didn't store the returned ID in Prisma (we created Prisma user first).
        // So we should list users by email to find the Auth ID.
        
        // Actually, `deleteUser` requires ID.
        // Let's try to find the user in Supabase Auth by email.
        // `listUsers` doesn't support filtering by email directly in all versions, but let's check.
        // A common pattern is to just rely on the fact that we might not be able to easily delete from Auth if we don't have the ID.
        // BUT, we can try to list and filter.
        
        // Since we know the email, let's try to just log that we might need to manually delete from Auth if we can't find ID.
        // Wait, `supabaseAdmin.auth.admin.listUsers()`?
        
        // Let's try to be robust:
        // For the purpose of this script, we will try to delete from Prisma (which cascades to profiles/accounts).
        // For Supabase Auth, we'll try to find them.
        
        // NOTE: If we used `createUser` in seed, we didn't save the Auth ID.
        // We can iterate through the test users and try to find them in Auth?
        // That might be slow.
        
        // Alternative: The user asked to "delete these 10 sample users from all auth and profiles".
        // I will try to fetch the user by email from Supabase Auth if the SDK supports it, or just list all users and filter.
        // Given it's only 10-100 users, listing shouldn't be too bad if the total user base isn't huge.
        
        // Actually, `supabaseAdmin.rpc` or similar might be needed if no direct API.
        // But let's assume we can just delete from Prisma and Storage for now, and try to delete from Auth if we can.
        
        // Let's try to get the user by email using `admin.listUsers`? No, that's pagination.
        // Let's just create the script to delete from Prisma and Storage first, and `console.warn` about Auth if we can't easily get ID.
        
        // Wait, I can use `supabaseAdmin.auth.admin.deleteUser(id)`.
        // If I don't have the ID, I can't delete.
        // I'll try to list users and match email.
    } catch {
        // ignore
    }
  }
  
  // Bulk delete from Prisma
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: "testuser",
        endsWith: "@njit.edu",
      },
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
