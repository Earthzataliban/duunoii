-- CreateEnum
CREATE TYPE "public"."VideoCategory" AS ENUM ('Technology', 'Music', 'Cooking', 'Fitness', 'Travel', 'Business', 'Gaming', 'Education', 'Other');

-- AlterTable
ALTER TABLE "public"."videos" ADD COLUMN     "category" "public"."VideoCategory";
