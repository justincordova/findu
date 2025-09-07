import prisma from "@/lib/prismaClient";

/**
 * Creates a like or superlike from one user to another.
 * If the recipient has already liked the sender, a match is created automatically along with a chat.
 *
 * @param data - Object containing:
 *   - from_user: ID of the user sending the like
 *   - to_user: ID of the user receiving the like
 *   - is_superlike?: optional flag for superlike
 * @returns The newly created like record
 */
export const createLike = async (data: { from_user: string; to_user: string; is_superlike?: boolean }) => {
  return prisma.$transaction(async (tx) => {
    // Step 1: create the like
    const like = await tx.likes.create({ data });

    // Step 2: check for reciprocal like
    const reciprocal = await tx.likes.findFirst({
      where: {
        from_user: data.to_user,
        to_user: data.from_user,
      },
    });

    // Step 3: if reciprocal exists, create a match and a chat
    if (reciprocal) {
      const match = await tx.matches.create({
        data: {
          user1: data.from_user,
          user2: data.to_user,
          matched_at: new Date(),
        },
      });

      // Create initial chat message
      await tx.chats.create({
        data: {
          match_id: match.id,
          message: "You matched! Start chatting now.", // required field
          sender_id: data.from_user, // adjust if your schema allows null or a system ID
        },
      });
    }

    return like;
  });
};

/**
 * Retrieves all likes sent by a specific user.
 */
export const getSentLikes = async (userId: string) => {
  return prisma.likes.findMany({
    where: { from_user: userId },
    include: { users_likes_to_userTousers: true },
  });
};

/**
 * Retrieves all likes received by a specific user.
 */
export const getReceivedLikes = async (userId: string) => {
  return prisma.likes.findMany({
    where: { to_user: userId },
    include: { users_likes_from_userTousers: true },
  });
};

/**
 * Deletes a like by its ID.
 */
export const deleteLike = async (id: string) => {
  return prisma.likes.delete({
    where: { id },
  });
};
