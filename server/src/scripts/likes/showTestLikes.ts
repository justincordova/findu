import prisma from '@/lib/prismaClient';

async function showLikes() {
  const targetEmail = 'jac352@njit.edu';

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      console.error(`User with email ${targetEmail} not found.`);
      process.exit(1);
    }

    console.log(`\nShowing all likes received by: ${targetEmail}\n`);

    const likes = await prisma.likes.findMany({
      where: { to_user: targetUser.id },
      include: {
        users_likes_from_userTousers: {
          include: {
            profiles: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (likes.length === 0) {
      console.log('No likes found.');
      return;
    }

    console.log(`Total likes received: ${likes.length}\n`);
    console.log('─'.repeat(80));

    likes.forEach((like, index) => {
      const fromUser = like.users_likes_from_userTousers;
      const profile = fromUser?.profiles;
      console.log(`${index + 1}. ${profile?.name || fromUser?.email}`);
      console.log(`   Email: ${fromUser?.email}`);
      console.log(`   Gender: ${profile?.gender}`);
      console.log(`   Age: ${profile?.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : 'N/A'}`);
      console.log(`   Major: ${profile?.major}`);
      console.log(`   Created: ${like.created_at?.toLocaleDateString()}`);
      if (index < likes.length - 1) console.log('─'.repeat(80));
    });

    console.log('─'.repeat(80));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

showLikes();
