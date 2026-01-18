/*
  Warnings:

  - Made the column `match_id` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sender_id` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_read` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sent_at` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `chats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `from_user` on table `likes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `to_user` on table `likes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_superlike` on table `likes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `likes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_match_id_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_sender_id_fkey";

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "media_url" TEXT,
ADD COLUMN     "message_type" VARCHAR(20) NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "read_at" TIMESTAMP(3),
ALTER COLUMN "match_id" SET NOT NULL,
ALTER COLUMN "sender_id" SET NOT NULL,
ALTER COLUMN "is_read" SET NOT NULL,
ALTER COLUMN "sent_at" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "likes" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
ALTER COLUMN "from_user" SET NOT NULL,
ALTER COLUMN "to_user" SET NOT NULL,
ALTER COLUMN "is_superlike" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "lifestyle" JSONB;

-- CreateIndex
CREATE INDEX "idx_chats_match_sent" ON "chats"("match_id", "sent_at");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
