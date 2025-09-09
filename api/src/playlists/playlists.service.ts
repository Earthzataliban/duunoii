import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(createPlaylistDto: CreatePlaylistDto, userId: string) {
    const playlist = await this.prisma.playlist.create({
      data: {
        ...createPlaylistDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return playlist;
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [playlists] = await Promise.all([
      this.prisma.playlist.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
          items: {
            take: 1,
            orderBy: { position: 'asc' },
            include: {
              video: {
                select: {
                  id: true,
                  title: true,
                  uploader: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.playlist.count({
        where: { userId },
      }),
    ]);

    return playlists;
  }

  async findPublic(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where: { isPublic: true },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
          items: {
            take: 1,
            orderBy: { position: 'asc' },
            include: {
              video: {
                select: {
                  id: true,
                  title: true,
                  uploader: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.playlist.count({
        where: { isPublic: true },
      }),
    ]);

    return {
      playlists,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: page * limit < total,
    };
  }

  async findOne(id: string, userId?: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            video: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    // Check if user can access this playlist
    if (!playlist.isPublic && playlist.userId !== userId) {
      throw new ForbiddenException('You do not have access to this playlist');
    }

    return playlist;
  }

  async update(
    id: string,
    updatePlaylistDto: UpdatePlaylistDto,
    userId: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only update your own playlists');
    }

    const updatedPlaylist = await this.prisma.playlist.update({
      where: { id },
      data: {
        ...updatePlaylistDto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return updatedPlaylist;
  }

  async remove(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.prisma.playlist.delete({
      where: { id },
    });

    return { success: true, message: 'Playlist deleted successfully' };
  }

  async addVideo(playlistId: string, videoId: string, userId: string) {
    // Check if playlist exists and belongs to user
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check if video is already in playlist
    const existingItem = await this.prisma.playlistItem.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (existingItem) {
      throw new BadRequestException('Video is already in this playlist');
    }

    // Get the next position
    const lastItem = await this.prisma.playlistItem.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
    });

    const position = lastItem ? lastItem.position + 1 : 1;

    // Add video to playlist
    const playlistItem = await this.prisma.playlistItem.create({
      data: {
        playlistId,
        videoId,
        position,
      },
      include: {
        video: {
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Update playlist's updatedAt timestamp
    await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Video added to playlist successfully',
      playlistItem,
    };
  }

  async removeVideo(playlistId: string, videoId: string, userId: string) {
    // Check if playlist exists and belongs to user
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    // Check if video is in playlist
    const playlistItem = await this.prisma.playlistItem.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (!playlistItem) {
      throw new NotFoundException('Video not found in playlist');
    }

    // Remove video from playlist
    await this.prisma.playlistItem.delete({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    // Reorder remaining items
    await this.reorderPlaylistItems(playlistId, playlistItem.position);

    // Update playlist's updatedAt timestamp
    await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Video removed from playlist successfully',
    };
  }

  async updateVideoPosition(
    playlistId: string,
    videoId: string,
    newPosition: number,
    userId: string,
  ) {
    // Check if playlist exists and belongs to user
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    // Check if video is in playlist
    const playlistItem = await this.prisma.playlistItem.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (!playlistItem) {
      throw new NotFoundException('Video not found in playlist');
    }

    const oldPosition = playlistItem.position;

    // Update position
    await this.prisma.playlistItem.update({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
      data: { position: newPosition },
    });

    // Reorder other items
    if (newPosition > oldPosition) {
      // Moving down - decrease positions of items between old and new position
      await this.prisma.playlistItem.updateMany({
        where: {
          playlistId,
          position: {
            gt: oldPosition,
            lte: newPosition,
          },
          videoId: { not: videoId },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    } else if (newPosition < oldPosition) {
      // Moving up - increase positions of items between new and old position
      await this.prisma.playlistItem.updateMany({
        where: {
          playlistId,
          position: {
            gte: newPosition,
            lt: oldPosition,
          },
          videoId: { not: videoId },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    // Update playlist's updatedAt timestamp
    await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Video position updated successfully',
    };
  }

  private async reorderPlaylistItems(
    playlistId: string,
    deletedPosition: number,
  ) {
    // Decrease position of all items that were after the deleted item
    await this.prisma.playlistItem.updateMany({
      where: {
        playlistId,
        position: {
          gt: deletedPosition,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });
  }
}
