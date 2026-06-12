"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const prisma_service_1 = require("../prisma/prisma.service");
function mapNotification(notification) {
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
function mapDeviceToken(deviceToken) {
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
function stringifyData(data) {
    const result = {};
    for (const [key, value] of Object.entries(data ?? {})) {
        result[key] =
            typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
}
let NotificationsService = class NotificationsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getFirebaseMessaging() {
        const projectId = this.configService.get('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
        const privateKeyRaw = this.configService.get('FIREBASE_PRIVATE_KEY');
        if (!projectId || !clientEmail || !privateKeyRaw) {
            throw new Error('Konfigurasi Firebase belum lengkap di .env');
        }
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
        if (!(0, app_1.getApps)().length) {
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }
        return (0, messaging_1.getMessaging)();
    }
    async registerDeviceToken(user, dto) {
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
    async findMyNotifications(user, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
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
    async markAsRead(id, user) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: BigInt(id),
                user_id: BigInt(user.profile.id),
            },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notifikasi tidak ditemukan');
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
    async markAllAsRead(user) {
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
    async createNotification(params) {
        const notification = await this.prisma.notification.create({
            data: {
                user_id: BigInt(params.userId),
                type: params.type ?? 'system',
                title: params.title,
                body: params.body,
                data: params.data ?? {},
            },
        });
        let pushResult = null;
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
            }
            catch (error) {
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
    async sendPushToUser(params) {
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
        const invalidTokenIds = [];
        response.responses.forEach((item, index) => {
            const errorCode = item.error?.code;
            if (errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token') {
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
    async sendTestNotification(user, dto) {
        return this.createNotification({
            userId: user.profile.id,
            type: 'system',
            title: dto.title,
            body: dto.body,
            data: dto.data,
            sendPush: true,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map