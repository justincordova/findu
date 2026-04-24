import prisma from "@/lib/prismaClient";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email as an argument.");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        profiles: true,
      },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    console.log("User found:", user);
    console.log("Profile:", user.profiles);
  } catch (error) {
    console.error("Error fetching user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
