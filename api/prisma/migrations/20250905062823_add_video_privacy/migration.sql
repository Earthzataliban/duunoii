-- CreateEnum
CREATE TYPE "public"."VideoPrivacy" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "public"."videos" ADD COLUMN     "privacy" "public"."VideoPrivacy" NOT NULL DEFAULT 'PUBLIC';
