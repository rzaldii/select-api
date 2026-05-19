import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @ApiOperation({ summary: 'Mendaftarkan FCM token device user' })
  async registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return {
      success: true,
      message: 'Device token berhasil didaftarkan',
      data: await this.notificationsService.registerDeviceToken(user, dto),
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Melihat notifikasi user yang sedang login' })
  async findMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.notificationsService.findMyNotifications(
      user,
      query,
    );

    return {
      success: true,
      message: 'Data notifikasi berhasil diambil',
      data: result.notifications,
      meta: result.meta,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Menandai satu notifikasi sebagai sudah dibaca' })
  @ApiParam({ name: 'id', example: 1 })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Notifikasi berhasil ditandai sudah dibaca',
      data: await this.notificationsService.markAsRead(id, user),
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Menandai semua notifikasi sebagai sudah dibaca' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Semua notifikasi berhasil ditandai sudah dibaca',
      data: await this.notificationsService.markAllAsRead(user),
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Mengirim notifikasi tes ke device sendiri' })
  async sendTestNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendTestNotificationDto,
  ) {
    return {
      success: true,
      message: 'Notifikasi tes berhasil dibuat',
      data: await this.notificationsService.sendTestNotification(user, dto),
    };
  }
}