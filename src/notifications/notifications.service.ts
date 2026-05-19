import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';

type NotificationTypeValue =
  | 'booking_created'
  | 'booking_approved'
  | 'booking_rejected'
  | 'payment_success'
  | 'payment_failed'
  | 'rental_reminder'
  | 'rental_completed'
  | 'system';

function mapNotification(notification: any) {
  return {
    id: Number(notification.id),
    user_id: Number(notification.user_id),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    is_read: notification.is_read,
    read_at: notification.read_at,
    created_at: notification.created_at,
  };
}

function mapDeviceToken(deviceToken: any) {
  return {
    id: Number(deviceToken.id),
    user_id: Number(deviceToken.user_id),
    fcm_token: deviceToken.fcm_token,
    platform: deviceToken.platform,
    device_name: deviceToken.device_name,
    is_active: deviceToken.is_active,
    last_seen_at: deviceToken.last_seen_at,
    created_at: deviceToken.created_at,
    updated_at: deviceToken.updated_at,
  };
}

function stringifyData(data?: Record<string, any>) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data ?? {})) {
    result[key] =
      typeof value === 'string' ? value : JSON.stringify(value);
  }

  return result;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getFirebaseMessaging() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new Error('Konfigurasi Firebase belum lengkap di .env');
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    return getMessaging();
  }

  async registerDeviceToken(
    user: AuthenticatedUser,
    dto: RegisterDeviceTokenDto,
  ) {
    const deviceToken = await this.prisma.deviceToken.upsert({
      where: {
        fcm_token: dto.fcm_token,
      },
      update: {
        user_id: BigInt(user.profile.id),
        platform: dto.platform,
        device_name: dto.device_name,
        is_active: true,
        last_seen_at: new Date(),
      },
      create: {
        user_id: BigInt(user.profile.id),
        fcm_token: dto.fcm_token,
        platform: dto.platform,
        device_name: dto.device_name,
        is_active: true,
        last_seen_at: new Date(),
      },
    });

    return mapDeviceToken(deviceToken);
  }

  async findMyNotifications(
    user: AuthenticatedUser,
    query: NotificationQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: BigInt(user.profile.id),
    };

    if (query.is_read !== undefined) {
      where.is_read = query.is_read;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          user_id: BigInt(user.profile.id),
          is_read: false,
        },
      }),
    ]);

    return {
      notifications: notifications.map(mapNotification),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        unread_count: unreadCount,
      },
    };
  }

  async markAsRead(id: number, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: BigInt(id),
        user_id: BigInt(user.profile.id),
      },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: {
        id: BigInt(id),
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return mapNotification(updatedNotification);
  }

  async markAllAsRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: {
        user_id: BigInt(user.profile.id),
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return {
      updated: true,
    };
  }

  async createNotification(params: {
    userId: number;
    type?: NotificationTypeValue;
    title: string;
    body: string;
    data?: Record<string, any>;
    sendPush?: boolean;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        user_id: BigInt(params.userId),
        type: params.type ?? 'system',
        title: params.title,
        body: params.body,
        data: params.data ?? {},
      },
    });

    let pushResult: any = null;

    if (params.sendPush) {
      try {
        pushResult = await this.sendPushToUser({
          userId: params.userId,
          title: params.title,
          body: params.body,
          data: {
            notification_id: Number(notification.id),
            type: params.type ?? 'system',
            ...(params.data ?? {}),
          },
        });
      } catch (error: any) {
        pushResult = {
          sent: 0,
          failed: 1,
          error: error?.message ?? 'Gagal mengirim push notification',
        };
      }
    }

    return {
      ...mapNotification(notification),
      push_result: pushResult,
    };
  }

  async sendPushToUser(params: {
    userId: number;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: {
        user_id: BigInt(params.userId),
        is_active: true,
      },
      select: {
        id: true,
        fcm_token: true,
      },
    });

    if (tokens.length === 0) {
      return {
        sent: 0,
        failed: 0,
        message: 'User belum memiliki FCM token aktif',
      };
    }

    const messaging = this.getFirebaseMessaging();

    const response = await messaging.sendEachForMulticast({
      tokens: tokens.map((token) => token.fcm_token),
      notification: {
        title: params.title,
        body: params.body,
      },
      data: stringifyData(params.data),
    });

    const invalidTokenIds: bigint[] = [];

    response.responses.forEach((item, index) => {
      const errorCode = item.error?.code;

      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token'
      ) {
        invalidTokenIds.push(tokens[index].id);
      }
    });

    if (invalidTokenIds.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: {
          id: {
            in: invalidTokenIds,
          },
        },
        data: {
          is_active: false,
        },
      });
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
      invalid_tokens_deactivated: invalidTokenIds.length,
    };
  }

  async sendTestNotification(
    user: AuthenticatedUser,
    dto: SendTestNotificationDto,
  ) {
    return this.createNotification({
      userId: user.profile.id,
      type: 'system',
      title: dto.title,
      body: dto.body,
      data: dto.data,
      sendPush: true,
    });
  }
}