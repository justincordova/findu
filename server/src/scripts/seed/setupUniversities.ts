import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up universities and domains...");

  try {
    // NJIT
    const njit = await prisma.universities.upsert({
      where: { slug: "njit" },
      update: {},
      create: {
        name: "New Jersey Institute of Technology",
        slug: "njit",
        university_domains: {
          create: { domain: "njit.edu" },
        },
      },
    });
    console.log(`✓ NJIT (${njit.id})`);

    // Northeastern
    const northeastern = await prisma.universities.upsert({
      where: { slug: "northeastern" },
      update: {},
      create: {
        name: "Northeastern University",
        slug: "northeastern",
        university_domains: {
          create: { domain: "northeastern.edu" },
        },
      },
    });
    console.log(`✓ Northeastern (${northeastern.id})`);

    // Rutgers
    const rutgers = await prisma.universities.upsert({
      where: { slug: "rutgers" },
      update: {},
      create: {
        name: "Rutgers University",
        slug: "rutgers",
        university_domains: {
          create: [
            { domain: "rutgers.edu" },
            { domain: "scarletmail.rutgers.edu" },
          ],
        },
      },
    });
    console.log(`✓ Rutgers (${rutgers.id})`);

    // Verify
    const universities = await prisma.universities.findMany({
      where: { slug: { in: ["njit", "northeastern", "rutgers"] } },
      include: { university_domains: true },
    });

    console.log("\n✓ Universities and domains setup complete:");
    universities.forEach((u) => {
      console.log(`  ${u.name} (${u.slug})`);
      u.university_domains.forEach((d) => {
        console.log(`    - ${d.domain}`);
      });
    });
  } catch (error) {
    console.error("Error setting up universities:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
