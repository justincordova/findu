import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function setupMatches() {
  const jac352Email = 'jac352@njit.edu';
  const graceLeeName = 'Grace Lee';
  const jessicaMartinezName = 'Jessica Martinez';

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

    // Find Grace Lee
    const graceLeeProfile = await prisma.profiles.findFirst({
      where: { name: graceLeeName },
      include: { users: true },
    });

    if (!graceLeeProfile) {
      console.error(`Profile "${graceLeeName}" not found`);
      process.exit(1);
    }

    const graceLeeUser = graceLeeProfile.users;
    console.log(`Found ${graceLeeName}: ${graceLeeUser.email} (ID: ${graceLeeUser.id})`);

    // Find Jessica Martinez
    const jessicaProfile = await prisma.profiles.findFirst({
      where: { name: jessicaMartinezName },
      include: { users: true },
    });

    if (!jessicaProfile) {
      console.error(`Profile "${jessicaMartinezName}" not found`);
      process.exit(1);
    }

    const jessicaUser = jessicaProfile.users;
    console.log(`Found ${jessicaMartinezName}: ${jessicaUser.email} (ID: ${jessicaUser.id})\n`);

    let successCount = 0;

    // Create match with Grace Lee
    try {
      const graceMatch = await prisma.matches.create({
        data: {
          user1: graceLeeName === 'Grace Lee' && graceLeeUser.id < jac352User.id
            ? graceLeeUser.id
            : jac352User.id,
          user2: graceLeeName === 'Grace Lee' && graceLeeUser.id < jac352User.id
            ? jac352User.id
            : graceLeeUser.id,
        },
      });
      console.log(`✓ Created match between jac352 and Grace Lee (ID: ${graceMatch.id})`);
      successCount++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⊘ Match between jac352 and Grace Lee already exists`);
      } else {
        throw error;
      }
    }

    // Create match with Jessica Martinez
    try {
      const jessicaMatch = await prisma.matches.create({
        data: {
          user1: jessicaUser.id < jac352User.id
            ? jessicaUser.id
            : jac352User.id,
          user2: jessicaUser.id < jac352User.id
            ? jac352User.id
            : jessicaUser.id,
        },
      });
      console.log(`✓ Created match between jac352 and Jessica Martinez (ID: ${jessicaMatch.id})`);
      successCount++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⊘ Match between jac352 and Jessica Martinez already exists`);
      } else {
        throw error;
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
