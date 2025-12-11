import { PrismaClient } from '@/generated/prisma';
import { calculateAge, getEligibleCandidates, getDiscoverProfiles } from '@/modules/discover/services';

const prisma = new PrismaClient();

async function debugDiscoverAlgorithm(viewerEmail: string, candidateEmail: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DISCOVER ALGORITHM DEBUG`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Get viewer profile
    const viewerUser = await prisma.user.findUnique({
      where: { email: viewerEmail },
      include: { profiles: true }
    });

    if (!viewerUser?.profiles) {
      console.error(`❌ Viewer ${viewerEmail} not found or has no profile`);
      return;
    }

    const viewerProfile = viewerUser.profiles;
    const viewerId = viewerUser.id;

    console.log(`👤 VIEWER: ${viewerProfile.name} (${viewerEmail})`);
    console.log(`   ID: ${viewerId}`);
    console.log(`   Age: ${calculateAge(viewerProfile.birthdate)} years old`);
    console.log(`   Gender Preference: ${JSON.stringify(viewerProfile.gender_preference)}`);
    console.log(`   Age Preference: ${viewerProfile.min_age}-${viewerProfile.max_age}`);

    // Get candidate profile
    const candidateUser = await prisma.user.findUnique({
      where: { email: candidateEmail },
      include: { profiles: true }
    });

    if (!candidateUser?.profiles) {
      console.error(`❌ Candidate ${candidateEmail} not found or has no profile`);
      return;
    }

    const candidateProfile = candidateUser.profiles;
    const candidateId = candidateUser.id;

    console.log(`\n👤 CANDIDATE: ${candidateProfile.name} (${candidateEmail})`);
    console.log(`   ID: ${candidateId}`);
    console.log(`   Age: ${calculateAge(candidateProfile.birthdate)} years old`);
    console.log(`   Gender Preference: ${JSON.stringify(candidateProfile.gender_preference)}`);
    console.log(`   Age Preference: ${candidateProfile.min_age}-${candidateProfile.max_age}`);

    // Step 1: Get eligible candidates
    console.log(`\n${'='.repeat(80)}`);
    console.log(`STEP 1: Getting eligible candidates from getEligibleCandidates()`);
    console.log(`${'='.repeat(80)}\n`);

    const eligibleCandidates = await getEligibleCandidates(viewerId, viewerProfile);
    console.log(`✓ Found ${eligibleCandidates.length} eligible candidates`);

    const candidateInEligible = eligibleCandidates.find(c => c.user_id === candidateId);
    if (candidateInEligible) {
      console.log(`✅ Candidate IS in eligible candidates list`);
      console.log(`   Name: ${candidateInEligible.name}`);
      console.log(`   Gender: ${candidateInEligible.gender}`);
      console.log(`   Age: ${calculateAge(candidateInEligible.birthdate)}`);
    } else {
      console.log(`❌ Candidate IS NOT in eligible candidates list`);
      console.log(`   Possible reasons:`);

      // Check interactions
      const likedByViewer = await prisma.likes.findUnique({
        where: {
          from_user_to_user: { from_user: viewerId, to_user: candidateId }
        }
      });
      if (likedByViewer) {
        console.log(`   - Viewer has already liked this candidate`);
      }

      const matchExists = await prisma.matches.findFirst({
        where: {
          OR: [
            { user1: viewerId, user2: candidateId },
            { user1: candidateId, user2: viewerId }
          ]
        }
      });
      if (matchExists) {
        console.log(`   - Match already exists between viewer and candidate`);
      }

      const blockExists = await prisma.blocks.findFirst({
        where: {
          OR: [
            { blocker_id: viewerId, blocked_id: candidateId },
            { blocker_id: candidateId, blocked_id: viewerId }
          ]
        }
      });
      if (blockExists) {
        console.log(`   - Block exists between viewer and candidate`);
      }

      // If none of the above, something else is filtering it out
      if (!likedByViewer && !matchExists && !blockExists) {
        console.log(`   - Not in likes/matches/blocks, so must be filtered by database query`);
        console.log(`   - This could be: university, campus, age range, gender preference, or interests`);
      }
    }

    // Step 2: Get discover profiles (full algorithm)
    console.log(`\n${'='.repeat(80)}`);
    console.log(`STEP 2: Getting discover profiles (full algorithm with ranking)`);
    console.log(`${'='.repeat(80)}\n`);

    const discoverProfiles = await getDiscoverProfiles(viewerId, 100, 0); // Get top 100 to check if candidate is there
    console.log(`✓ Discover returned ${discoverProfiles.length} profiles`);

    const candidateInDiscover = discoverProfiles.find(p => p.user_id === candidateId);
    if (candidateInDiscover) {
      console.log(`✅ Candidate IS in discover feed`);
      console.log(`   Name: ${candidateInDiscover.name}`);
      console.log(`   Position: #${discoverProfiles.indexOf(candidateInDiscover) + 1}`);
      console.log(`   Compatibility Score: ${candidateInDiscover.compatibilityScore}`);
      console.log(`   Liked By User (TIER 1): ${candidateInDiscover.likedByUser}`);
    } else {
      console.log(`❌ Candidate IS NOT in discover feed`);
      console.log(`   But candidate was in eligible candidates: ${!!candidateInEligible}`);

      if (candidateInEligible) {
        console.log(`\n   This suggests the issue is in the scoring or filtering AFTER getEligibleCandidates()`);
        console.log(`   Showing first 5 candidates in discover feed:`);
        discoverProfiles.slice(0, 5).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - Score: ${p.compatibilityScore}, Liked: ${p.likedByUser}`);
        });
      }
    }

    // Manual filter check
    console.log(`\n${'='.repeat(80)}`);
    console.log(`STEP 3: Manual filter check (to verify hard filters)`);
    console.log(`${'='.repeat(80)}\n`);

    const viewerAge = calculateAge(viewerProfile.birthdate);
    const candidateAge = calculateAge(candidateProfile.birthdate);

    console.log(`University match: ${viewerProfile.university_id === candidateProfile.university_id ? '✅' : '❌'}`);
    console.log(`Campus match: ${viewerProfile.campus_id === candidateProfile.campus_id ? '✅' : '❌'}`);
    console.log(`Candidate in viewer's age range (${viewerProfile.min_age}-${viewerProfile.max_age}): ${
      candidateAge >= viewerProfile.min_age && candidateAge <= viewerProfile.max_age ? '✅' : '❌'
    }`);
    console.log(`Viewer in candidate's age range (${candidateProfile.min_age}-${candidateProfile.max_age}): ${
      viewerAge >= candidateProfile.min_age && viewerAge <= candidateProfile.max_age ? '✅' : '❌'
    }`);

    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
const viewerEmail = process.argv[2] || 'testuser8@njit.edu';
const candidateEmail = process.argv[3] || 'jac352@njit.edu';

debugDiscoverAlgorithm(viewerEmail, candidateEmail);
