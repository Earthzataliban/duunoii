import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Patch,
  Body,
  Post,
  Delete,
  Query,
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

  @Post(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribeToUser(
    @Param('id') subscribedToId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.subscribeToUser(req.user.userId, subscribedToId);
  }

  @Delete(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribeFromUser(
    @Param('id') subscribedToId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.unsubscribeFromUser(
      req.user.userId,
      subscribedToId,
    );
  }

  @Get(':id/subscription-status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(
    @Param('id') subscribedToId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.getSubscriptionStatus(
      req.user.userId,
      subscribedToId,
    );
  }

  @Get('me/subscriptions')
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 10 : 10;
    return this.usersService.getUserSubscriptions(
      req.user.userId,
      parsedPage,
      parsedLimit,
    );
  }

  @Get(':id/subscribers')
  async getUserSubscribers(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 10 : 10;
    return this.usersService.getUserSubscribers(
      userId,
      parsedPage,
      parsedLimit,
    );
  }

  @Get(':id/subscriptions')
  async getUserSubscriptions(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page) || 1 : 1;
    const parsedLimit = limit ? parseInt(limit) || 10 : 10;
    return this.usersService.getUserSubscriptions(
      userId,
      parsedPage,
      parsedLimit,
    );
  }
}
