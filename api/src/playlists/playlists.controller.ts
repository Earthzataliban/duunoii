import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoToPlaylistDto } from './dto/add-video-to-playlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/jwt-request.interface';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPlaylistDto: CreatePlaylistDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.create(createPlaylistDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 20 : 20;
    return this.playlistsService.findAll(
      req.user.userId,
      parsedPage,
      parsedLimit,
    );
  }

  @Get('public')
  findPublic(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 20 : 20;
    return this.playlistsService.findPublic(parsedPage, parsedLimit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.playlistsService.findOne(id, req.user?.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.update(id, updatePlaylistDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.playlistsService.remove(id, req.user.userId);
  }

  @Post(':id/videos')
  @UseGuards(JwtAuthGuard)
  addVideo(
    @Param('id') playlistId: string,
    @Body() addVideoDto: AddVideoToPlaylistDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.addVideo(
      playlistId,
      addVideoDto.videoId,
      req.user.userId,
    );
  }

  @Delete(':id/videos/:videoId')
  @UseGuards(JwtAuthGuard)
  removeVideo(
    @Param('id') playlistId: string,
    @Param('videoId') videoId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.removeVideo(
      playlistId,
      videoId,
      req.user.userId,
    );
  }

  @Patch(':id/videos/:videoId/position')
  @UseGuards(JwtAuthGuard)
  updateVideoPosition(
    @Param('id') playlistId: string,
    @Param('videoId') videoId: string,
    @Body('position') position: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.updateVideoPosition(
      playlistId,
      videoId,
      position,
      req.user.userId,
    );
  }
}
