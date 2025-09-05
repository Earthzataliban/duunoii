import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoStatus } from '@prisma/client';
import { HLSService } from './hls.service';
import { UploadProgressGateway } from './upload-progress.gateway';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ProcessingOptions {
  resolution: string;
  width: number;
  height: number;
  bitrate: string;
}

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);

  // Predefined processing configurations
  private readonly processingConfigs: ProcessingOptions[] = [
    {
      resolution: '360p',
      width: 640,
      height: 360,
      bitrate: '500k',
    },
    {
      resolution: '720p',
      width: 1280,
      height: 720,
      bitrate: '1500k',
    },
    {
      resolution: '1080p',
      width: 1920,
      height: 1080,
      bitrate: '3000k',
    },
  ];

  constructor(
    private prisma: PrismaService,
    private hlsService: HLSService,
    @Inject(forwardRef(() => UploadProgressGateway))
    private uploadProgressGateway: UploadProgressGateway,
  ) {}

  async processVideo(videoId: string): Promise<void> {
    try {
      this.logger.log(`Starting video processing for video ID: ${videoId}`);

      // Get video information
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        include: { uploader: true },
      });

      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      // Broadcast initial processing progress
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'validating',
        uploadProgress: 100,
        processingProgress: 0,
        overallProgress: 35,
        currentTask: 'Validating and analyzing video file...',
      });

      // Use absolute path to ensure we find the uploaded file
      const inputPath = path.resolve(
        __dirname,
        '..',
        '..',
        'uploads',
        'videos',
        video.uploaderId,
        video.filename,
      );

      // Check if input file exists
      await fs.access(inputPath);

      // Create output directory for processed videos
      const outputDir = path.resolve(
        __dirname,
        '..',
        '..',
        'uploads',
        'videos',
        video.uploaderId,
        videoId,
      );
      await fs.mkdir(outputDir, { recursive: true });

      // Broadcast metadata extraction progress
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'processing',
        uploadProgress: 100,
        processingProgress: 10,
        overallProgress: 40,
        currentTask: 'Extracting video metadata...',
      });

      // Extract video metadata and generate thumbnail
      const metadata = await this.getVideoMetadata(inputPath);

      // Broadcast thumbnail generation progress
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'processing',
        uploadProgress: 100,
        processingProgress: 25,
        overallProgress: 50,
        currentTask: 'Generating video thumbnail...',
      });

      const thumbnailPath = await this.generateThumbnail(
        inputPath,
        outputDir,
        videoId,
      );

      // Broadcast transcoding progress
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'encoding',
        uploadProgress: 100,
        processingProgress: 40,
        overallProgress: 60,
        currentTask: 'Transcoding video to multiple resolutions...',
      });

      // Process video for multiple resolutions
      const processedFiles = await this.transcodeVideo(
        inputPath,
        outputDir,
        videoId,
        metadata.hasAudio,
      );

      // Update video record with metadata and processed files
      await this.updateVideoRecord(
        videoId,
        metadata.duration,
        thumbnailPath,
        processedFiles,
      );

      // Broadcast HLS generation progress
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'finalizing',
        uploadProgress: 100,
        processingProgress: 90,
        overallProgress: 90,
        currentTask: 'Generating streaming files...',
      });

      // Generate HLS streams for adaptive streaming
      await this.hlsService.generateHLSStreams(videoId);

      // Broadcast completion
      this.uploadProgressGateway.broadcastProgress(videoId, video.uploaderId, {
        videoId,
        stage: 'completed',
        uploadProgress: 100,
        processingProgress: 100,
        overallProgress: 100,
        currentTask: 'Video processing completed successfully!',
      });

      this.logger.log(`Video processing completed for video ID: ${videoId}`);
    } catch (error) {
      this.logger.error(
        `Video processing failed for video ID: ${videoId}`,
        error,
      );

      // Get video info for error broadcasting
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        select: { uploaderId: true },
      });

      // Broadcast error
      if (video) {
        this.uploadProgressGateway.broadcastProgress(
          videoId,
          video.uploaderId,
          {
            videoId,
            stage: 'error',
            uploadProgress: 0,
            processingProgress: 0,
            overallProgress: 0,
            error:
              error instanceof Error
                ? error.message
                : 'Video processing failed',
          },
        );
      }

      // Update video status to FAILED
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: VideoStatus.FAILED },
      });

      throw new Error(
        `Video processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async getVideoMetadata(inputPath: string): Promise<{
    duration: number;
    width?: number;
    height?: number;
    hasAudio: boolean;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );

        const audioStream = metadata.streams.find(
          (stream) => stream.codec_type === 'audio',
        );

        resolve({
          duration: Math.floor(metadata.format.duration || 0),
          width: videoStream?.width,
          height: videoStream?.height,
          hasAudio: !!audioStream,
        });
      });
    });
  }

  private async generateThumbnail(
    inputPath: string,
    outputDir: string,
    videoId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const thumbnailFilename = `${videoId}-thumbnail.jpg`;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          folder: outputDir,
          filename: thumbnailFilename,
          timestamps: ['10%'], // Take thumbnail at 10% of video duration
        })
        .on('end', () => {
          this.logger.log(`Thumbnail generated: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (err: Error) => {
          this.logger.error('Thumbnail generation failed:', err);
          reject(err);
        });
    });
  }

  private async transcodeVideo(
    inputPath: string,
    outputDir: string,
    videoId: string,
    hasAudio: boolean,
  ): Promise<
    Array<{
      resolution: string;
      filePath: string;
      fileSize: number;
      bitrate: number;
    }>
  > {
    const processedFiles: Array<{
      resolution: string;
      filePath: string;
      fileSize: number;
      bitrate: number;
    }> = [];

    // Process each resolution sequentially to avoid overwhelming the system
    for (const config of this.processingConfigs) {
      try {
        this.logger.log(
          `Processing ${config.resolution} for video ID: ${videoId}`,
        );

        const outputFilename = `${videoId}-${config.resolution}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);

        await this.transcodeToResolution(
          inputPath,
          outputPath,
          config,
          hasAudio,
        );

        // Get file size
        const stats = await fs.stat(outputPath);
        const fileSize = stats.size;

        // Convert configured bitrate to bps
        const bitrate = parseInt(config.bitrate.replace('k', '')) * 1000; // Convert to bps

        processedFiles.push({
          resolution: config.resolution,
          filePath: outputPath,
          fileSize,
          bitrate,
        });

        this.logger.log(
          `Completed ${config.resolution} processing for video ID: ${videoId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process ${config.resolution} for video ID: ${videoId}`,
          error,
        );
        // Continue with other resolutions even if one fails
        continue;
      }
    }

    if (processedFiles.length === 0) {
      throw new Error('Failed to process video in any resolution');
    }

    return processedFiles;
  }

  private async transcodeToResolution(
    inputPath: string,
    outputPath: string,
    config: ProcessingOptions,
    hasAudio: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set timeout for large file processing (10 minutes)
      const timeout = setTimeout(
        () => {
          this.logger.error(
            `Transcoding timeout for ${config.resolution} after 10 minutes`,
          );
          reject(new Error(`Transcoding timeout for ${config.resolution}`));
        },
        10 * 60 * 1000,
      );

      const command = ffmpeg(inputPath)
        .size(`${config.width}x${config.height}`)
        .videoBitrate(config.bitrate)
        .videoCodec('libx264')
        .format('mp4')
        .outputOptions([
          '-preset',
          'medium', // Balance between speed and compression
          '-crf',
          '23', // Constant rate factor for good quality
          '-movflags',
          '+faststart', // Enable progressive download
          '-threads',
          '0', // Use all available CPU cores
        ]);

      // Only add audio codec if audio stream exists
      if (hasAudio) {
        command.audioCodec('aac');
      } else {
        command.outputOptions(['-an']); // No audio stream
      }

      command
        .output(outputPath)
        .on('start', (commandLine: string) => {
          this.logger.log(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress: any) => {
          if (progress.percent && progress.percent > 0) {
            this.logger.log(
              `Processing ${config.resolution}: ${Math.round(progress.percent)}%`,
            );
          }
        })
        .on('end', () => {
          clearTimeout(timeout);
          this.logger.log(`Transcoding completed: ${outputPath}`);
          resolve();
        })
        .on('error', (err: Error) => {
          clearTimeout(timeout);
          this.logger.error('Transcoding failed:', err);
          reject(err);
        })
        .run();
    });
  }

  private async updateVideoRecord(
    videoId: string,
    duration: number,
    thumbnailPath: string,
    processedFiles: Array<{
      resolution: string;
      filePath: string;
      fileSize: number;
      bitrate: number;
    }>,
  ): Promise<void> {
    // Update video record
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        duration,
        thumbnailUrl: thumbnailPath,
        status: VideoStatus.READY,
      },
    });

    // Create VideoFile records for each processed resolution
    const videoFileData = processedFiles.map((file) => ({
      videoId,
      resolution: file.resolution,
      filePath: file.filePath,
      fileSize: file.fileSize,
      bitrate: file.bitrate,
    }));

    await this.prisma.videoFile.createMany({
      data: videoFileData,
    });

    this.logger.log(
      `Updated video record and created ${processedFiles.length} video files for video ID: ${videoId}`,
    );
  }

  async getProcessingProgress(videoId: string): Promise<{
    status: VideoStatus;
    progress?: string;
  }> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { status: true },
    });

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    return {
      status: video.status,
      // In a real implementation, you might store progress in Redis or database
      progress:
        video.status === VideoStatus.PROCESSING ? 'Processing...' : undefined,
    };
  }
}
