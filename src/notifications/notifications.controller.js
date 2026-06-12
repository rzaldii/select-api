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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const notification_query_dto_1 = require("./dto/notification-query.dto");
const register_device_token_dto_1 = require("./dto/register-device-token.dto");
const send_test_notification_dto_1 = require("./dto/send-test-notification.dto");
const notifications_service_1 = require("./notifications.service");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async registerDeviceToken(user, dto) {
        return {
            success: true,
            message: 'Device token berhasil didaftarkan',
            data: await this.notificationsService.registerDeviceToken(user, dto),
        };
    }
    async findMyNotifications(user, query) {
        const result = await this.notificationsService.findMyNotifications(user, query);
        return {
            success: true,
            message: 'Data notifikasi berhasil diambil',
            data: result.notifications,
            meta: result.meta,
        };
    }
    async markAsRead(user, id) {
        return {
            success: true,
            message: 'Notifikasi berhasil ditandai sudah dibaca',
            data: await this.notificationsService.markAsRead(id, user),
        };
    }
    async markAllAsRead(user) {
        return {
            success: true,
            message: 'Semua notifikasi berhasil ditandai sudah dibaca',
            data: await this.notificationsService.markAllAsRead(user),
        };
    }
    async sendTestNotification(user, dto) {
        return {
            success: true,
            message: 'Notifikasi tes berhasil dibuat',
            data: await this.notificationsService.sendTestNotification(user, dto),
        };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('register-device'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendaftarkan FCM token device user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_device_token_dto_1.RegisterDeviceTokenDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "registerDeviceToken", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat notifikasi user yang sedang login' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_query_dto_1.NotificationQueryDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "findMyNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Menandai satu notifikasi sebagai sudah dibaca' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Menandai semua notifikasi sebagai sudah dibaca' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengirim notifikasi tes ke device sendiri' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_test_notification_dto_1.SendTestNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTestNotification", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map