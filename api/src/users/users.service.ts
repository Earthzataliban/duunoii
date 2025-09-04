import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async subscribeToUser(subscriberId: string, subscribedToId: string) {
    // Check if trying to subscribe to yourself
    if (subscriberId === subscribedToId) {
      throw new BadRequestException('You cannot subscribe to yourself');
    }

    // Check if both users exist
    const [subscriber, subscribedTo] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: subscriberId } }),
      this.prisma.user.findUnique({ where: { id: subscribedToId } }),
    ]);

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    if (!subscribedTo) {
      throw new NotFoundException('User to subscribe to not found');
    }

    // Check if already subscribed
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        subscriberId_subscribedToId: {
          subscriberId,
          subscribedToId,
        },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Already subscribed to this user');
    }

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        subscriberId,
        subscribedToId,
      },
      include: {
        subscribedTo: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Get updated subscriber counts
    const subscriberCount = await this.prisma.subscription.count({
      where: { subscribedToId },
    });

    return {
      success: true,
      subscription,
      subscriberCount,
    };
  }

  async unsubscribeFromUser(subscriberId: string, subscribedToId: string) {
    // Check if subscription exists
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        subscriberId_subscribedToId: {
          subscriberId,
          subscribedToId,
        },
      },
    });

    if (!subscription) {
      throw new BadRequestException('You are not subscribed to this user');
    }

    // Delete subscription
    await this.prisma.subscription.delete({
      where: {
        subscriberId_subscribedToId: {
          subscriberId,
          subscribedToId,
        },
      },
    });

    // Get updated subscriber counts
    const subscriberCount = await this.prisma.subscription.count({
      where: { subscribedToId },
    });

    return {
      success: true,
      subscriberCount,
    };
  }

  async getSubscriptionStatus(subscriberId: string, subscribedToId: string) {
    // Check if subscription exists
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        subscriberId_subscribedToId: {
          subscriberId,
          subscribedToId,
        },
      },
    });

    // Get subscriber count for the target user
    const subscriberCount = await this.prisma.subscription.count({
      where: { subscribedToId },
    });

    return {
      isSubscribed: !!subscription,
      subscriberCount,
      subscribedAt: subscription?.createdAt || null,
    };
  }

  async getUserSubscriptions(userId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { subscriberId: userId },
        include: {
          subscribedTo: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              _count: {
                select: {
                  subscribers: true,
                  videos: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.subscription.count({
        where: { subscriberId: userId },
      }),
    ]);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserSubscribers(userId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { subscribedToId: userId },
        include: {
          subscriber: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              _count: {
                select: {
                  subscribers: true,
                  videos: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.subscription.count({
        where: { subscribedToId: userId },
      }),
    ]);

    return {
      subscribers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
