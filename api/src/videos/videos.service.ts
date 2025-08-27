import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoStatus } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

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

    return video;
  }

  async findAll(userId?: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: userId ? { uploaderId: userId } : undefined,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.video.count({
        where: userId ? { uploaderId: userId } : undefined,
      }),
    ]);

    return {
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
}
