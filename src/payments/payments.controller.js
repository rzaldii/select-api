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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createPayment(user, bookingId) {
        return {
            success: true,
            message: 'Transaksi pembayaran berhasil dibuat',
            data: await this.paymentsService.createPayment(bookingId, user),
        };
    }
    async findPaymentByBooking(user, bookingId) {
        return {
            success: true,
            message: 'Status pembayaran berhasil diambil',
            data: await this.paymentsService.findPaymentByBooking(bookingId, user),
        };
    }
    async handleMidtransWebhook(payload) {
        return {
            success: true,
            message: 'Webhook Midtrans berhasil diproses',
            data: await this.paymentsService.handleMidtransWebhook(payload),
        };
    }
    async simulatePaid(user, bookingId) {
        return {
            success: true,
            message: 'Pembayaran berhasil disimulasikan',
            data: await this.paymentsService.simulatePaymentSuccess(bookingId, user),
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('payments/create/:bookingId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat transaksi pembayaran Midtrans Snap' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('payments/booking/:bookingId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat status pembayaran berdasarkan booking' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findPaymentByBooking", null);
__decorate([
    (0, common_1.Post)('payments/webhook/midtrans'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook Midtrans untuk update status pembayaran' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                transaction_status: 'settlement',
                order_id: 'SEL-2026-0001',
                status_code: '200',
                gross_amount: '1360000.00',
                signature_key: 'signature_key_from_midtrans',
                payment_type: 'bank_transfer',
                transaction_id: 'midtrans-transaction-id',
                fraud_status: 'accept',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleMidtransWebhook", null);
__decorate([
    (0, common_1.Post)('payments/booking/:bookingId/simulate-paid'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Simulasi pembayaran berhasil untuk testing Midtrans' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "simulatePaid", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map