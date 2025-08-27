import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    username: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateData: Record<string, unknown>,
  ) {
    const updatedUser = await this.usersService.update(
      req.user.userId,
      updateData,
    );
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
