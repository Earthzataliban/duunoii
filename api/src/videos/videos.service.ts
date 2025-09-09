import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

interface FindAllVideosOptions {
  userId?: string;
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
}
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { LikeVideoDto } from './dto/like-video.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { VideoStatus, LikeType } from '@prisma/client';
import { VideoQueueService } from './video-queue.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private videoQueueService: VideoQueueService,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    // Validate file type
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video file type');
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new BadRequestException('Video file too large (max 500MB)');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'videos', userId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create video record in database
    const video = await this.prisma.video.create({
      data: {
        title: createVideoDto.title,
        description: createVideoDto.description,
        category: createVideoDto.category,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: VideoStatus.PROCESSING,
        uploaderId: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Queue video processing job
    try {
      await this.videoQueueService.addVideoProcessingJob(video.id, userId);
    } catch {
      // If queue fails, update video status to FAILED
      await this.prisma.video.update({
        where: { id: video.id },
        data: { status: VideoStatus.FAILED },
      });
      throw new BadRequestException('Failed to queue video for processing');
    }

    return video;
  }

  async findAll(options: FindAllVideosOptions) {
    const {
      userId,
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'newest',
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause
    const baseConditions: any = {
      status: 'READY', // Only show ready videos
    };

    if (userId) {
      baseConditions.uploaderId = userId;
    }

    if (category) {
      baseConditions.category = category;
    }

    // Build final where clause
    let where: any = baseConditions;

    if (search) {
      where = {
        AND: [
          baseConditions,
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
        ],
      };
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_viewed':
        orderBy = { views: 'desc' };
        break;
      case 'least_viewed':
        orderBy = { views: 'asc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        videoFiles: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto, userId: string) {
    // Check if video exists and user owns it
    const existingVideo = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      throw new NotFoundException('Video not found');
    }

    if (existingVideo.uploaderId !== userId) {
      throw new BadRequestException('You can only update your own videos');
    }

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateVideoDto,
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return updatedVideo;
  }

  async remove(id: string, userId: string) {
    // Check if video exists and user owns it
    const existingVideo = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      throw new NotFoundException('Video not found');
    }

    if (existingVideo.uploaderId !== userId) {
      throw new BadRequestException('You can only delete your own videos');
    }

    // Delete video file from filesystem
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      userId,
      existingVideo.filename,
    );

    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      // File might not exist, continue with database deletion
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Could not delete file ${filePath}:`, errorMessage);
    }

    // Delete video from database (cascade will handle related records)
    await this.prisma.video.delete({
      where: { id },
    });

    return { message: 'Video deleted successfully' };
  }

  async incrementViews(id: string) {
    await this.prisma.video.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async getProcessingStatus(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      select: { status: true, title: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      videoId: id,
      status: video.status,
      title: video.title,
    };
  }

  async getQueueStats() {
    return await this.videoQueueService.getQueueStats();
  }

  async getThumbnail(id: string) {
    // Get video information
    const video = await this.prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        thumbnailUrl: true,
        uploaderId: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (!video.thumbnailUrl) {
      throw new NotFoundException('Thumbnail not available');
    }

    // If thumbnailUrl is a full path, use it directly
    // Otherwise, construct the path
    let thumbnailPath: string;
    if (path.isAbsolute(video.thumbnailUrl)) {
      thumbnailPath = video.thumbnailUrl;
    } else {
      // Construct path relative to uploads directory
      thumbnailPath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        video.uploaderId,
        video.id,
        `${video.id}-thumbnail.jpg`,
      );
    }

    try {
      const thumbnailBuffer = await fs.readFile(thumbnailPath);
      return thumbnailBuffer;
    } catch {
      throw new NotFoundException('Thumbnail file not found');
    }
  }

  async likeVideo(videoId: string, userId: string, likeVideoDto: LikeVideoDto) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Use upsert to handle like/dislike toggle logic
    const like = await this.prisma.like.upsert({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
      update: {
        type: likeVideoDto.type,
      },
      create: {
        videoId,
        userId,
        type: likeVideoDto.type,
      },
      include: {
        video: {
          select: {
            _count: {
              select: {
                likes: {
                  where: { type: LikeType.LIKE },
                },
              },
            },
          },
        },
      },
    });

    // Get updated like/dislike counts
    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.like.count({
        where: { videoId, type: LikeType.LIKE },
      }),
      this.prisma.like.count({
        where: { videoId, type: LikeType.DISLIKE },
      }),
    ]);

    return {
      success: true,
      userLikeType: like.type,
      likeCount,
      dislikeCount,
    };
  }

  async unlikeVideo(videoId: string, userId: string) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check if user has liked/disliked the video
    const existingLike = await this.prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('You have not liked/disliked this video');
    }

    // Remove the like/dislike
    await this.prisma.like.delete({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    // Get updated like/dislike counts
    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.like.count({
        where: { videoId, type: LikeType.LIKE },
      }),
      this.prisma.like.count({
        where: { videoId, type: LikeType.DISLIKE },
      }),
    ]);

    return {
      success: true,
      userLikeType: null,
      likeCount,
      dislikeCount,
    };
  }

  async getVideoLikeStatus(videoId: string, userId?: string) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Get like/dislike counts
    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.like.count({
        where: { videoId, type: LikeType.LIKE },
      }),
      this.prisma.like.count({
        where: { videoId, type: LikeType.DISLIKE },
      }),
    ]);

    let userLikeType: LikeType | null = null;
    if (userId) {
      const userLike = await this.prisma.like.findUnique({
        where: {
          videoId_userId: {
            videoId,
            userId,
          },
        },
      });
      userLikeType = userLike?.type || null;
    }

    return {
      likeCount,
      dislikeCount,
      userLikeType,
    };
  }

  async createComment(
    videoId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // If parentId is provided, check if parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment || parentComment.videoId !== videoId) {
        throw new BadRequestException(
          'Parent comment not found or not from this video',
        );
      }
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        videoId,
        userId,
        parentId: createCommentDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  async getVideoComments(
    videoId: string,
    page = 1,
    limit = 10,
    sortBy: 'newest' | 'oldest' = 'newest',
  ) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const offset = (page - 1) * limit;

    const orderBy =
      sortBy === 'newest'
        ? { createdAt: 'desc' as const }
        : { createdAt: 'asc' as const };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          videoId,
          parentId: null, // Only top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 3, // Show first 3 replies, can load more later
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          videoId,
          parentId: null,
        },
      }),
    ]);

    return {
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentReplies(commentId: string, page = 1, limit = 10) {
    // Check if parent comment exists
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const offset = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { parentId: commentId },
      }),
    ]);

    return {
      replies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateComment(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    // Check if comment exists and user owns it
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new BadRequestException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    // Check if comment exists and user owns it
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    // Delete comment (cascade will handle replies)
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      message: `Comment deleted along with ${comment._count.replies} replies`,
    };
  }

  async saveWatchProgress(
    videoId: string,
    userId: string,
    progress: number,
    duration: number,
  ) {
    // Validate video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Don't save very short watches or invalid progress
    if (progress < 1 || duration < 5 || progress > duration + 10) {
      // Allow some buffer for duration
      return { success: false, message: 'Invalid watch progress' };
    }

    // Upsert watch history
    const watchHistory = await this.prisma.viewHistory.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        progress: Math.floor(progress),
        watchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        progress: Math.floor(progress),
        watchedAt: new Date(),
      },
    });

    return {
      success: true,
      progress: watchHistory.progress,
      watchedAt: watchHistory.watchedAt,
    };
  }

  async getWatchProgress(videoId: string, userId: string) {
    // Validate video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Get watch history
    const watchHistory = await this.prisma.viewHistory.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    if (!watchHistory) {
      return {
        progress: 0,
        watchedAt: null,
        hasWatched: false,
      };
    }

    return {
      progress: watchHistory.progress,
      watchedAt: watchHistory.watchedAt,
      hasWatched: true,
    };
  }

  async removeWatchProgress(videoId: string, userId: string) {
    // Validate video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Delete watch history entry
    const deleted = await this.prisma.viewHistory.deleteMany({
      where: {
        userId,
        videoId,
      },
    });

    return {
      success: true,
      message:
        deleted.count > 0
          ? 'Removed from watch history'
          : 'Video was not in watch history',
      removed: deleted.count > 0,
    };
  }
}
