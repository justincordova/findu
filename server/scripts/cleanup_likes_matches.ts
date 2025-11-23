import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting cleanup of likes and matches...");

  try {
    // Delete all Match records
    const deleteMatches = await prisma.matches.deleteMany({});
    console.log(`Deleted ${deleteMatches.count} match records.`);

    // Delete all Like records
    const deleteLikes = await prisma.likes.deleteMany({});
    console.log(`Deleted ${deleteLikes.count} like records.`);

    console.log("Cleanup complete.");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();