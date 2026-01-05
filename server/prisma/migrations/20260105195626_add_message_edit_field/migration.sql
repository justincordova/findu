/*
  Warnings:

  - You are about to drop the column `created_at` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `chats` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_matches_user1";

-- DropIndex
DROP INDEX "idx_matches_user2";

-- DropIndex
DROP INDEX "idx_profiles_campus_id";

-- DropIndex
DROP INDEX "idx_profiles_university_id";

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "edited_at" TIMESTAMP(3);
