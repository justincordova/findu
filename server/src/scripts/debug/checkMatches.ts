import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

async function checkMatches() {
  const targetEmail = 'jac352@njit.edu';

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      console.error(`User with email ${targetEmail} not found.`);
      process.exit(1);
    }

    console.log(`\nChecking matches and mutual likes for: ${targetEmail}\n`);

    // Get all received likes
    const receivedLikes = await prisma.likes.findMany({
      where: { to_user: targetUser.id },
      include: {
        users_likes_from_userTousers: {
          include: {
            profiles: true,
          },
        },
      },
    });

    console.log(`Total received likes: ${receivedLikes.length}`);
    console.log('─'.repeat(100));

    // For each received like, check if there's a reciprocal like
    for (const receivedLike of receivedLikes) {
      const fromUser = receivedLike.users_likes_from_userTousers;
      const profile = fromUser?.profiles;

      // Check for reciprocal like (from target to this user)
      const reciprocalLike = await prisma.likes.findFirst({
        where: {
          from_user: targetUser.id,
          to_user: fromUser?.id,
        },
      });

      // Check for match
      const match = await prisma.matches.findFirst({
        where: {
          OR: [
            { user1: targetUser.id, user2: fromUser?.id },
            { user1: fromUser?.id, user2: targetUser.id },
          ],
        },
      });

      const status = reciprocalLike ? '✓ MUTUAL' : '✗ ONE-WAY';
      const matchStatus = match ? '(MATCH EXISTS)' : '';

      console.log(`${status} - ${profile?.name || fromUser?.email} ${matchStatus}`);
      console.log(`      From: ${fromUser?.email}`);
      console.log(`      Gender: ${profile?.gender}, Age: ${profile?.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : 'N/A'}`);
      if (reciprocalLike) {
        console.log(`      Reciprocal: YES - Match created: ${match ? 'YES' : 'NO'}`);
      }
      console.log();
    }

    // Check total matches
    const matches = await prisma.matches.findMany({
      where: {
        OR: [{ user1: targetUser.id }, { user2: targetUser.id }],
      },
      include: {
        users_matches_user1Tousers: {
          include: {
            profiles: true,
          },
        },
        users_matches_user2Tousers: {
          include: {
            profiles: true,
          },
        },
      },
    });

    console.log('─'.repeat(100));
    console.log(`\nTotal matches in database: ${matches.length}`);
    if (matches.length > 0) {
      console.log('\nMatches:');
      for (const match of matches) {
        const otherUser = match.user1 === targetUser.id ? match.users_matches_user2Tousers : match.users_matches_user1Tousers;
        const otherProfile = otherUser?.profiles;
        console.log(`- ${otherProfile?.name || otherUser?.email} (Matched: ${match.matched_at?.toLocaleDateString()})`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatches();
