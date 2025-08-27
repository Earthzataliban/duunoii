-- CreateEnum
CREATE TYPE "public"."VideoStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."LikeType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER,
    "status" "public"."VideoStatus" NOT NULL DEFAULT 'PROCESSING',
    "thumbnailUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_files" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "bitrate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."likes" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."LikeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playlists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playlist_items" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."view_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "view_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscribedToId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "video_files_videoId_resolution_key" ON "public"."video_files"("videoId", "resolution");

-- CreateIndex
CREATE UNIQUE INDEX "likes_videoId_userId_key" ON "public"."likes"("videoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlistId_videoId_key" ON "public"."playlist_items"("playlistId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "view_history_userId_videoId_key" ON "public"."view_history"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscriberId_subscribedToId_key" ON "public"."subscriptions"("subscriberId", "subscribedToId");

-- AddForeignKey
ALTER TABLE "public"."videos" ADD CONSTRAINT "videos_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_files" ADD CONSTRAINT "video_files_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlists" ADD CONSTRAINT "playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_items" ADD CONSTRAINT "playlist_items_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_items" ADD CONSTRAINT "playlist_items_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."view_history" ADD CONSTRAINT "view_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."view_history" ADD CONSTRAINT "view_history_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_subscribedToId_fkey" FOREIGN KEY ("subscribedToId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
