import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function setupMatches() {
  const jac352Email = 'jac352@njit.edu';
  const sophiaAndersonName = 'Sophia Anderson';
  const fionaMillerName = 'Fiona Miller';
  const aliceSmithName = 'Alice Smith';
  const graceLeeName = 'Grace Lee';

  try {
    // Get jac352 user
    const jac352User = await prisma.user.findUnique({
      where: { email: jac352Email },
    });

    if (!jac352User) {
      console.error(`User ${jac352Email} not found`);
      process.exit(1);
    }

    console.log(`Found jac352: ${jac352User.email} (ID: ${jac352User.id})\n`);

    // Find all target users
    const targetNames = [sophiaAndersonName, fionaMillerName, aliceSmithName, graceLeeName];
    const targetUsers = [];

    for (const name of targetNames) {
      const profile = await prisma.profiles.findFirst({
        where: { name },
        include: { users: true },
      });

      if (!profile) {
        console.error(`Profile "${name}" not found`);
        process.exit(1);
      }

      targetUsers.push({ name, user: profile.users });
      console.log(`Found ${name}: ${profile.users.email} (ID: ${profile.users.id})`);
    }

    console.log('');
    let successCount = 0;

    // Create matches with all target users
    for (const { name, user } of targetUsers) {
      try {
        const match = await prisma.matches.create({
          data: {
            user1: user.id < jac352User.id ? user.id : jac352User.id,
            user2: user.id < jac352User.id ? jac352User.id : user.id,
          },
        });
        console.log(`✓ Created match between jac352 and ${name} (ID: ${match.id})`);
        successCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⊘ Match between jac352 and ${name} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Successfully created: ${successCount} matches`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupMatches();
