import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';

interface HLSConfig {
  resolution: string;
  width: number;
  height: number;
  bitrate: string;
  bandwidth: number;
}

@Injectable()
export class HLSService {
  private readonly logger = new Logger(HLSService.name);

  // HLS streaming configurations
  private readonly hlsConfigs: HLSConfig[] = [
    {
      resolution: '360p',
      width: 640,
      height: 360,
      bitrate: '500k',
      bandwidth: 800000,
    },
    {
      resolution: '720p',
      width: 1280,
      height: 720,
      bitrate: '1500k',
      bandwidth: 2000000,
    },
    {
      resolution: '1080p',
      width: 1920,
      height: 1080,
      bitrate: '3000k',
      bandwidth: 4000000,
    },
  ];

  constructor(private prisma: PrismaService) {}

  async generateHLSStreams(videoId: string): Promise<void> {
    try {
      this.logger.log(`Generating HLS streams for video ID: ${videoId}`);

      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        include: { uploader: true },
      });

      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      const inputPath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        video.uploaderId,
        video.filename,
      );

      // Create HLS output directory
      const hlsDir = path.join(
        process.cwd(),
        'uploads',
        'videos',
        video.uploaderId,
        videoId,
        'hls',
      );
      await fs.mkdir(hlsDir, { recursive: true });

      // Generate HLS streams for each resolution
      const streamPromises = this.hlsConfigs.map((config) =>
        this.generateHLSStream(inputPath, hlsDir, videoId, config),
      );

      await Promise.all(streamPromises);

      // Generate master playlist
      await this.generateMasterPlaylist(hlsDir);

      this.logger.log(
        `HLS streams generated successfully for video ID: ${videoId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate HLS streams for video ID: ${videoId}`,
        error,
      );
      throw error;
    }
  }

  private async generateHLSStream(
    inputPath: string,
    outputDir: string,
    videoId: string,
    config: HLSConfig,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, `${config.resolution}.m3u8`);
      const segmentPath = path.join(outputDir, `${config.resolution}_%03d.ts`);

      this.logger.log(`Generating ${config.resolution} HLS stream`);

      ffmpeg(inputPath)
        .size(`${config.width}x${config.height}`)
        .videoBitrate(config.bitrate)
        .audioCodec('aac')
        .videoCodec('libx264')
        .outputOptions([
          '-preset',
          'medium',
          '-crf',
          '23',
          '-sc_threshold',
          '0', // Disable scene change detection for consistent segment length
          '-g',
          '30', // GOP size (keyframe interval)
          '-keyint_min',
          '30', // Minimum keyframe interval
          '-hls_time',
          '6', // Segment duration in seconds
          '-hls_playlist_type',
          'vod', // Video on demand playlist
          '-hls_segment_filename',
          segmentPath,
          '-f',
          'hls',
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          this.logger.log(
            `FFmpeg HLS command for ${config.resolution}: ${commandLine}`,
          );
        })
        .on('progress', (progress) => {
          if (progress.percent && progress.percent > 0) {
            this.logger.log(
              `HLS ${config.resolution} progress: ${Math.round(progress.percent)}%`,
            );
          }
        })
        .on('end', () => {
          this.logger.log(`HLS stream completed: ${config.resolution}`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(
            `HLS generation failed for ${config.resolution}:`,
            err,
          );
          reject(err);
        })
        .run();
    });
  }

  private async generateMasterPlaylist(hlsDir: string): Promise<void> {
    const masterPlaylistPath = path.join(hlsDir, 'master.m3u8');

    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    for (const config of this.hlsConfigs) {
      const playlistFile = `${config.resolution}.m3u8`;
      const playlistPath = path.join(hlsDir, playlistFile);

      // Check if the resolution playlist exists
      try {
        await fs.access(playlistPath);

        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${config.bandwidth},RESOLUTION=${config.width}x${config.height}\n`;
        masterPlaylist += `${playlistFile}\n\n`;
      } catch {
        this.logger.warn(
          `Resolution ${config.resolution} playlist not found, skipping`,
        );
      }
    }

    await fs.writeFile(masterPlaylistPath, masterPlaylist);
    this.logger.log(`Master playlist generated: ${masterPlaylistPath}`);
  }

  async getHLSManifest(videoId: string): Promise<string> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { uploaderId: true },
    });

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const masterPlaylistPath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      video.uploaderId,
      videoId,
      'hls',
      'master.m3u8',
    );

    try {
      const manifest = await fs.readFile(masterPlaylistPath, 'utf-8');
      return manifest;
    } catch {
      throw new Error(`HLS manifest not found for video ${videoId}`);
    }
  }

  async getPlaylistFile(videoId: string, filename: string): Promise<string> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { uploaderId: true },
    });

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const playlistPath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      video.uploaderId,
      videoId,
      'hls',
      filename,
    );

    try {
      const playlist = await fs.readFile(playlistPath, 'utf-8');
      return playlist;
    } catch {
      throw new Error(
        `Playlist file ${filename} not found for video ${videoId}`,
      );
    }
  }

  async getSegmentFile(videoId: string, filename: string): Promise<Buffer> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { uploaderId: true },
    });

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const segmentPath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      video.uploaderId,
      videoId,
      'hls',
      filename,
    );

    try {
      const segment = await fs.readFile(segmentPath);
      return segment;
    } catch {
      throw new Error(
        `Segment file ${filename} not found for video ${videoId}`,
      );
    }
  }

  async checkHLSExists(videoId: string): Promise<boolean> {
    try {
      const video = await this.prisma.video.findUnique({
        where: { id: videoId },
        select: { uploaderId: true },
      });

      if (!video) {
        return false;
      }

      const masterPlaylistPath = path.join(
        process.cwd(),
        'uploads',
        'videos',
        video.uploaderId,
        videoId,
        'hls',
        'master.m3u8',
      );

      await fs.access(masterPlaylistPath);
      return true;
    } catch {
      return false;
    }
  }
}
