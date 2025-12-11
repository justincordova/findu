import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function createMatchesWithSameUniversity() {
  const targetEmail = 'test@northeastern.edu';

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 Starting match creation...\n');

    // Get the target user with their university
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { 
        profiles: {
          include: {
            universities: true
          }
        }
      },
    });

    if (!targetUser?.profiles) {
      console.error('Target user or profile not found');
      process.exit(1);
    }

    const targetUniversity = targetUser.profiles.universities;
    
    console.log(`Found target user: ${targetUser.email}`);
    console.log(`Profile: ${targetUser.profiles.name}`);
    console.log(`University: ${targetUniversity.name}\n`);

    // Get all other users at the SAME university
    const sameUniversityUsers = await prisma.user.findMany({
      where: {
        id: { not: targetUser.id },
        profiles: {
          university_id: targetUser.profiles.university_id,
        },
      },
      include: { profiles: true },
    });

    console.log(`Found ${sameUniversityUsers.length} users at ${targetUniversity.name}\n`);

    let likesCreated = 0;
    let matchesCreated = 0;
    let skipped = 0;
    let errors = 0;

    // PHASE 1: Create all likes
    console.log('📝 Phase 1: Creating mutual likes...\n');

    for (const otherUser of sameUniversityUsers) {
      const userName = otherUser.profiles?.name || otherUser.email;

      if (!otherUser.profiles) {
        skipped++;
        continue;
      }

      try {
        // Check if likes already exist
        const [existingLike1, existingLike2] = await Promise.all([
          prisma.likes.findUnique({
            where: {
              from_user_to_user: {
                from_user: targetUser.id,
                to_user: otherUser.id,
              },
            },
          }),
          prisma.likes.findUnique({
            where: {
              from_user_to_user: {
                from_user: otherUser.id,
                to_user: targetUser.id,
              },
            },
          }),
        ]);

        let created = 0;

        // Create first like
        if (!existingLike1) {
          await prisma.likes.create({
            data: {
              from_user: targetUser.id,
              to_user: otherUser.id,
              is_superlike: false,
            },
          });
          created++;
        }

        // Create second like  
        if (!existingLike2) {
          await prisma.likes.create({
            data: {
              from_user: otherUser.id,
              to_user: targetUser.id,
              is_superlike: false,
            },
          });
          created++;
        }

        if (created > 0) {
          console.log(`  ✓ Created ${created} like(s) with "${userName}"`);
          likesCreated += created;
        } else {
          console.log(`  ⊘ Likes with "${userName}" already exist`);
          skipped++;
        }

      } catch (error) {
        console.error(`  ✗ Failed to create likes with "${userName}":`, 
          error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log(`\n✓ Phase 1 complete: ${likesCreated} likes created\n`);

    // PHASE 2: Create all matches
    console.log('🤝 Phase 2: Creating matches...\n');

    for (const otherUser of sameUniversityUsers) {
      const userName = otherUser.profiles?.name || otherUser.email;

      if (!otherUser.profiles) continue;

      try {
        // Check if match already exists
        const existingMatch = await prisma.matches.findFirst({
          where: {
            OR: [
              { user1: targetUser.id, user2: otherUser.id },
              { user1: otherUser.id, user2: targetUser.id },
            ],
          },
        });

        if (existingMatch) {
          console.log(`  ⊘ Match with "${userName}" already exists`);
          continue;
        }

        // Check if mutual likes exist
        const [like1, like2] = await Promise.all([
          prisma.likes.findUnique({
            where: {
              from_user_to_user: {
                from_user: targetUser.id,
                to_user: otherUser.id,
              },
            },
          }),
          prisma.likes.findUnique({
            where: {
              from_user_to_user: {
                from_user: otherUser.id,
                to_user: targetUser.id,
              },
            },
          }),
        ]);

        // Only create match if BOTH likes exist
        if (like1 && like2) {
          // Ensure user1 < user2 for the unique constraint
          const [user1, user2] = targetUser.id < otherUser.id 
            ? [targetUser.id, otherUser.id]
            : [otherUser.id, targetUser.id];

          await prisma.matches.create({
            data: {
              user1,
              user2,
              matched_at: new Date(),
            },
          });

          console.log(`  ✓ Created match with "${userName}"`);
          matchesCreated++;
        } else {
          console.log(`  ⊘ Missing mutual likes for "${userName}"`);
        }

      } catch (error) {
        console.error(`  ✗ Failed to create match with "${userName}":`, 
          error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n✓ Phase 2 complete: ${matchesCreated} matches created\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n=== Final Summary ===`);
    console.log(`University: ${targetUniversity.name}`);
    console.log(`Likes created: ${likesCreated}`);
    console.log(`Matches created: ${matchesCreated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    const totalMatches = await prisma.matches.count({
      where: {
        OR: [{ user1: targetUser.id }, { user2: targetUser.id }],
      },
    });

    console.log(`\nTotal matches for ${targetUser.email}: ${totalMatches}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createMatchesWithSameUniversity();