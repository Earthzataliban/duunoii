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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/jwt-request.interface';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

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
}
