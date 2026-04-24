import prisma from "@/lib/prismaClient";

async function cleanupJac352() {
  try {
    console.log("Starting jac352 cleanup...");

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: "jac352@njit.edu" },
    });

    if (!user) {
      console.log("User jac352@njit.edu not found.");
      return;
    }

    console.log(`Found user: ${user.email} (${user.id})`);

    // Delete profile
    await prisma.profiles.delete({
      where: { user_id: user.id },
    });
    console.log("Deleted profile for jac352");

    // Delete sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    console.log("Deleted sessions for jac352");

    // Delete accounts
    await prisma.account.deleteMany({
      where: { userId: user.id },
    });
    console.log("Deleted accounts for jac352");

    // Delete user
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log("Deleted user jac352");

    console.log("jac352 cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupJac352();
