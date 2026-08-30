import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(
    user: AuthUser,
    filters: {
      status?: string;
      type?: string;
    },
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: this.parseStatus(filters.status),
        type: this.parseType(filters.type),
      },
      select: this.notificationSelect(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async getUnreadCount(user: AuthUser) {
    const count = await this.prisma.notification.count({
      where: {
        userId: user.id,
        status: NotificationStatus.UNREAD,
        deletedAt: null,
      },
    });

    return {
      unreadCount: count,
    };
  }

  async markAsRead(user: AuthUser, notificationId: string) {
    await this.findMineOrFail(user.id, notificationId);

    return this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
      select: this.notificationSelect(),
    });
  }

  async markAllAsRead(user: AuthUser) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.id,
        status: NotificationStatus.UNREAD,
        deletedAt: null,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async archiveMine(user: AuthUser, notificationId: string) {
    await this.findMineOrFail(user.id, notificationId);

    return this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: NotificationStatus.ARCHIVED,
      },
      select: this.notificationSelect(),
    });
  }

  async removeMine(user: AuthUser, notificationId: string) {
    await this.findMineOrFail(user.id, notificationId);

    await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Notification removed.',
    };
  }

  private async findMineOrFail(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  private parseStatus(status?: string) {
    if (!status) {
      return undefined;
    }

    const normalized = status.trim().toUpperCase();

    if (!Object.values(NotificationStatus).includes(normalized as NotificationStatus)) {
      throw new BadRequestException('Invalid notification status.');
    }

    return normalized as NotificationStatus;
  }

  private parseType(type?: string) {
    if (!type) {
      return undefined;
    }

    const normalized = type.trim().toUpperCase();

    if (!Object.values(NotificationType).includes(normalized as NotificationType)) {
      throw new BadRequestException('Invalid notification type.');
    }

    return normalized as NotificationType;
  }

  private notificationSelect(): Prisma.NotificationSelect {
    return {
      id: true,
      type: true,
      status: true,
      title: true,
      message: true,
      data: true,
      readAt: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
      reservation: {
        select: {
          id: true,
          reservationNumber: true,
          status: true,
          reservedFor: true,
        },
      },
    };
  }
}
