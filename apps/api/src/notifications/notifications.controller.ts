import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMine(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.getMine(user, {
      status,
      type,
    });
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user, notificationId);
  }

  @Patch(':id/archive')
  archiveMine(
    @CurrentUser() user: AuthUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.archiveMine(user, notificationId);
  }

  @Delete(':id')
  removeMine(
    @CurrentUser() user: AuthUser,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.removeMine(user, notificationId);
  }
}
