import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

async function cleanupTestLikes() {
  const targetEmail = 'jac352@njit.edu';
  const fromNames = [
    'Ivy Chen',
  ];

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      console.error(`Target user with email ${targetEmail} not found.`);
      process.exit(1);
    }

    console.log(`\nCleaning up test likes for: ${targetEmail}\n`);

    // Delete all likes involving the target user and test users
    let deletedCount = 0;
    for (const fromName of fromNames) {
      const profile = await prisma.profiles.findFirst({
        where: { name: fromName },
        include: { users: true },
      });

      if (!profile || !profile.users) continue;

      // Delete likes from test user to target
      const deleted1 = await prisma.likes.deleteMany({
        where: {
          from_user: profile.users.id,
          to_user: targetUser.id,
        },
      });

      // Delete likes from target to test user
      const deleted2 = await prisma.likes.deleteMany({
        where: {
          from_user: targetUser.id,
          to_user: profile.users.id,
        },
      });

      if (deleted1.count > 0 || deleted2.count > 0) {
        console.log(`✓ Deleted ${deleted1.count + deleted2.count} likes for "${fromName}"`);
        deletedCount += deleted1.count + deleted2.count;
      }
    }

    // Also delete any matches created from these likes
    const matchesDeleted = await prisma.matches.deleteMany({
      where: {
        OR: [
          { user1: targetUser.id },
          { user2: targetUser.id },
        ],
      },
    });

    console.log(`\n✓ Deleted ${matchesDeleted.count} matches`);
    console.log(`✓ Total likes deleted: ${deletedCount}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupTestLikes();
