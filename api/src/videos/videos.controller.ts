import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Request,
  BadRequestException,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideosService } from './videos.service';
import { HLSService } from './hls.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/jwt-request.interface';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly hlsService: HLSService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    return this.videosService.create(createVideoDto, file, req.user.userId);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 10 : 10;
    return this.videosService.findAll(userId, parsedPage, parsedLimit);
  }

  @Get('my-videos')
  @UseGuards(JwtAuthGuard)
  async findMyVideos(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 10 : 10;
    return this.videosService.findAll(req.user.userId, parsedPage, parsedLimit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.videosService.update(id, updateVideoDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.videosService.remove(id, req.user.userId);
  }

  @Post(':id/view')
  async incrementView(@Param('id') id: string) {
    return this.videosService.incrementViews(id);
  }

  @Get(':id/processing-status')
  async getProcessingStatus(@Param('id') id: string) {
    return this.videosService.getProcessingStatus(id);
  }

  @Get('admin/queue-stats')
  @UseGuards(JwtAuthGuard)
  async getQueueStats() {
    // In a real app, you might want to add admin role check here
    return this.videosService.getQueueStats();
  }

  @Get(':id/stream/master.m3u8')
  async getHLSManifest(@Param('id') id: string, @Res() res: Response) {
    try {
      const manifest = await this.hlsService.getHLSManifest(id);
      res.setHeader('Content-Type', 'application/x-mpegURL');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(manifest);
    } catch {
      throw new HttpException('HLS manifest not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/stream/:filename')
  async getHLSPlaylistOrSegment(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      if (filename.endsWith('.m3u8')) {
        // It's a playlist file
        const playlist = await this.hlsService.getPlaylistFile(id, filename);
        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(playlist);
      } else if (filename.endsWith('.ts')) {
        // It's a video segment
        const segment = await this.hlsService.getSegmentFile(id, filename);
        res.setHeader('Content-Type', 'video/MP2T');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache segments for 1 day
        res.send(segment);
      } else {
        throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
      }
    } catch {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/regenerate-hls')
  @UseGuards(JwtAuthGuard)
  async regenerateHLS(@Param('id') id: string) {
    try {
      await this.hlsService.generateHLSStreams(id);
      return { success: true, message: 'HLS streams regenerated successfully' };
    } catch {
      throw new HttpException(
        'Failed to regenerate HLS streams',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
