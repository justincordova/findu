import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create universities
  const njit = await prisma.universities.upsert({
    where: { slug: "njit" },
    update: {},
    create: {
      name: "New Jersey Institute of Technology",
      slug: "njit",
    },
  });

  const northeastern = await prisma.universities.upsert({
    where: { slug: "northeastern" },
    update: {},
    create: {
      name: "Northeastern University",
      slug: "northeastern",
    },
  });

  const rutgers = await prisma.universities.upsert({
    where: { slug: "rutgers" },
    update: {},
    create: {
      name: "Rutgers University",
      slug: "rutgers",
    },
  });

  console.log("✅ Universities created");

  // Create university domains
  await prisma.university_domains.upsert({
    where: {
      university_id_domain: {
        university_id: njit.id,
        domain: "njit.edu",
      },
    },
    update: {},
    create: {
      university_id: njit.id,
      domain: "njit.edu",
    },
  });

  await prisma.university_domains.upsert({
    where: {
      university_id_domain: {
        university_id: northeastern.id,
        domain: "northeastern.edu",
      },
    },
    update: {},
    create: {
      university_id: northeastern.id,
      domain: "northeastern.edu",
    },
  });

  await prisma.university_domains.upsert({
    where: {
      university_id_domain: {
        university_id: rutgers.id,
        domain: "rutgers.edu",
      },
    },
    update: {},
    create: {
      university_id: rutgers.id,
      domain: "rutgers.edu",
    },
  });

  await prisma.university_domains.upsert({
    where: {
      university_id_domain: {
        university_id: rutgers.id,
        domain: "scarletmail.rutgers.edu",
      },
    },
    update: {},
    create: {
      university_id: rutgers.id,
      domain: "scarletmail.rutgers.edu",
    },
  });

  console.log("✅ University domains created");

  // Verify
  const universities = await prisma.universities.findMany({
    where: {
      slug: {
        in: ["njit", "northeastern", "rutgers"],
      },
    },
    include: {
      university_domains: true,
    },
  });

  console.log("\n📊 Seeded data:");
  universities.forEach((uni: any) => {
    console.log(`\n${uni.name} (${uni.slug})`);
    uni.university_domains.forEach((domain: any) => {
      console.log(`  - ${domain.domain}`);
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
