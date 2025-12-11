import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

async function createLikes() {
  const targetEmail = 'jac352@njit.edu';
  const fromNames = [
    'Ivy Chen',
  ];

  try {
    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      console.error(`Target user with email ${targetEmail} not found.`);
      process.exit(1);
    }

    console.log(`Found target user: ${targetUser.email} (ID: ${targetUser.id})\n`);

    // Create likes from each source user to the target user
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const fromName of fromNames) {
      try {
        // Find profile by name, then get the user
        const profile = await prisma.profiles.findFirst({
          where: {
            name: fromName,
          },
          include: {
            users: true,
          },
        });

        if (!profile) {
          console.log(`✗ Profile with name "${fromName}" not found - skipping`);
          skipCount++;
          continue;
        }

        const fromUser = profile.users;

        if (!fromUser) {
          console.log(`✗ User "${fromName}" not found - skipping`);
          skipCount++;
          continue;
        }

        // Check if like already exists
        const existingLike = await prisma.likes.findUnique({
          where: {
            from_user_to_user: {
              from_user: fromUser.id,
              to_user: targetUser.id,
            },
          },
        });

        if (existingLike) {
          console.log(`⊘ Like from "${fromName}" to "${targetUser.email}" already exists - skipping`);
          skipCount++;
          continue;
        }

        // Create the like
        await prisma.likes.create({
          data: {
            from_user: fromUser.id,
            to_user: targetUser.id,
            is_superlike: false,
          },
        });

        console.log(`✓ Created like from "${fromName}" to "${targetUser.email}"`);
        successCount++;
      } catch (error) {
        console.error(`✗ Error creating like for "${fromName}":`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Successfully created: ${successCount} likes`);
    console.log(`Skipped (already exist or user not found): ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createLikes();
