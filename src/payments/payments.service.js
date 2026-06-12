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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const SUCCESS_PAYMENT_STATUSES = ['settlement', 'capture'];
const FAILED_PAYMENT_STATUSES = ['deny', 'cancel', 'failure'];
const RETRYABLE_PAYMENT_STATUSES = ['deny', 'cancel', 'expire', 'failure'];
function mapPayment(payment) {
    return {
        id: Number(payment.id),
        booking_id: Number(payment.booking_id),
        provider: payment.provider,
        external_order_id: payment.external_order_id,
        transaction_id: payment.transaction_id,
        snap_token: payment.snap_token,
        redirect_url: payment.redirect_url,
        gross_amount: Number(payment.gross_amount),
        payment_type: payment.payment_type,
        status: payment.status,
        fraud_status: payment.fraud_status,
        paid_at: payment.paid_at,
        expired_at: payment.expired_at,
        raw_response: payment.raw_response,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        booking: payment.booking
            ? {
                id: Number(payment.booking.id),
                booking_code: payment.booking.booking_code,
                status: payment.booking.status,
                total_amount: Number(payment.booking.total_amount),
            }
            : null,
    };
}
let PaymentsService = class PaymentsService {
    constructor(prisma, configService, notificationsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.notificationsService = notificationsService;
    }
    async notifyAdmins(params) {
        const admins = await this.prisma.profile.findMany({
            where: {
                role: 'admin',
                is_active: true,
            },
            select: {
                id: true,
            },
        });
        await Promise.all(admins.map((admin) => this.notificationsService.createNotification({
            userId: Number(admin.id),
            type: params.type,
            title: params.title,
            body: params.body,
            data: params.data,
            sendPush: true,
        })));
    }
    getMidtransServerKey() {
        const serverKey = this.configService.get('MIDTRANS_SERVER_KEY');
        if (!serverKey) {
            throw new Error('MIDTRANS_SERVER_KEY belum tersedia di .env');
        }
        return serverKey;
    }
    getSnapUrl() {
        const isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION') === 'true';
        return isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }
    getBasicAuthHeader() {
        const serverKey = this.getMidtransServerKey();
        const encoded = Buffer.from(`${serverKey}:`).toString('base64');
        return `Basic ${encoded}`;
    }
    toPaymentStatus(status) {
        const allowed = [
            'pending',
            'settlement',
            'capture',
            'deny',
            'cancel',
            'expire',
            'refund',
            'failure',
        ];
        if (status && allowed.includes(status)) {
            return status;
        }
        return 'pending';
    }
    verifyMidtransSignature(payload) {
        const serverKey = this.getMidtransServerKey();
        const orderId = String(payload.order_id ?? '');
        const statusCode = String(payload.status_code ?? '');
        const grossAmount = String(payload.gross_amount ?? '');
        const signatureKey = String(payload.signature_key ?? '');
        if (!orderId || !statusCode || !grossAmount || !signatureKey) {
            throw new common_1.BadRequestException('Payload Midtrans tidak lengkap');
        }
        const expectedSignature = (0, crypto_1.createHash)('sha512')
            .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
            .digest('hex');
        if (signatureKey !== expectedSignature) {
            throw new common_1.ForbiddenException('Signature Midtrans tidak valid');
        }
    }
    async createPayment(bookingId, user) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(bookingId),
            },
            include: {
                customer: true,
                booking_items: true,
                payment: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (Number(booking.customer_id) !== user.profile.id) {
            throw new common_1.ForbiddenException('Tidak boleh membayar booking ini');
        }
        if (!['waiting_payment', 'payment_pending'].includes(booking.status)) {
            throw new common_1.BadRequestException('Booking belum berada pada status menunggu pembayaran');
        }
        if (booking.payment &&
            booking.payment.status === 'pending' &&
            booking.payment.snap_token) {
            return mapPayment(booking.payment);
        }
        if (booking.payment &&
            SUCCESS_PAYMENT_STATUSES.includes(booking.payment.status)) {
            return mapPayment(booking.payment);
        }
        const grossAmount = Math.round(Number(booking.total_amount));
        if (grossAmount <= 0) {
            throw new common_1.BadRequestException('Total pembayaran tidak valid');
        }
        const shouldCreateNewOrderId = booking.payment &&
            RETRYABLE_PAYMENT_STATUSES.includes(booking.payment.status);
        const externalOrderId = shouldCreateNewOrderId
            ? `${booking.booking_code}-${Date.now()}`
            : booking.booking_code;
        const itemDetails = booking.booking_items.map((item) => ({
            id: String(item.item_id),
            price: Math.round(Number(item.daily_price_snapshot)),
            quantity: Number(booking.total_days ?? 1),
            name: item.item_name_snapshot.substring(0, 50),
        }));
        if (Number(booking.service_fee) > 0) {
            itemDetails.push({
                id: 'SERVICE-FEE',
                price: Math.round(Number(booking.service_fee)),
                quantity: 1,
                name: 'Biaya layanan SELECT',
            });
        }
        const payload = {
            transaction_details: {
                order_id: externalOrderId,
                gross_amount: grossAmount,
            },
            customer_details: {
                first_name: booking.customer.full_name,
                email: booking.customer.email,
                phone: booking.customer.phone ?? undefined,
            },
            item_details: itemDetails,
        };
        const response = await fetch(this.getSnapUrl(), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: this.getBasicAuthHeader(),
            },
            body: JSON.stringify(payload),
        });
        const responseBody = await response.json();
        if (!response.ok) {
            throw new common_1.BadRequestException({
                message: 'Gagal membuat transaksi Midtrans',
                midtrans_response: responseBody,
            });
        }
        const payment = await this.prisma.$transaction(async (tx) => {
            const savedPayment = booking.payment
                ? await tx.payment.update({
                    where: {
                        id: booking.payment.id,
                    },
                    data: {
                        external_order_id: externalOrderId,
                        snap_token: responseBody.token,
                        redirect_url: responseBody.redirect_url,
                        gross_amount: grossAmount,
                        status: 'pending',
                        raw_response: responseBody,
                        expired_at: null,
                    },
                    include: {
                        booking: true,
                    },
                })
                : await tx.payment.create({
                    data: {
                        booking_id: booking.id,
                        provider: 'midtrans',
                        external_order_id: externalOrderId,
                        snap_token: responseBody.token,
                        redirect_url: responseBody.redirect_url,
                        gross_amount: grossAmount,
                        status: 'pending',
                        raw_response: responseBody,
                    },
                    include: {
                        booking: true,
                    },
                });
            await tx.booking.update({
                where: {
                    id: booking.id,
                },
                data: {
                    status: 'payment_pending',
                },
            });
            return savedPayment;
        });
        const mappedPayment = mapPayment(payment);
        await this.notificationsService.createNotification({
            userId: user.profile.id,
            type: 'system',
            title: 'Link Pembayaran Dibuat',
            body: `Silakan selesaikan pembayaran untuk booking ${booking.booking_code}.`,
            data: {
                booking_id: Number(booking.id),
                booking_code: booking.booking_code,
                payment_id: mappedPayment.id,
                redirect_url: mappedPayment.redirect_url,
            },
            sendPush: false,
        });
        return mappedPayment;
    }
    async findPaymentByBooking(bookingId, user) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(bookingId),
            },
            include: {
                payment: {
                    include: {
                        booking: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        const isOwner = Number(booking.customer_id) === user.profile.id;
        const isAdmin = user.profile.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Tidak boleh mengakses pembayaran ini');
        }
        if (!booking.payment) {
            throw new common_1.NotFoundException('Pembayaran belum dibuat');
        }
        return mapPayment(booking.payment);
    }
    async handleMidtransWebhook(payload) {
        this.verifyMidtransSignature(payload);
        const externalOrderId = String(payload.order_id);
        const transactionStatus = String(payload.transaction_status ?? 'pending');
        const paymentStatus = this.toPaymentStatus(transactionStatus);
        const fraudStatus = payload.fraud_status
            ? String(payload.fraud_status)
            : null;
        const payment = await this.prisma.payment.findUnique({
            where: {
                external_order_id: externalOrderId,
            },
            include: {
                booking: true,
            },
        });
        if (!payment) {
            return {
                ignored: true,
                message: 'Payment tidak ditemukan, webhook diabaikan',
            };
        }
        const isSuccess = SUCCESS_PAYMENT_STATUSES.includes(paymentStatus) &&
            fraudStatus !== 'deny';
        const isExpired = paymentStatus === 'expire';
        const isFailed = FAILED_PAYMENT_STATUSES.includes(paymentStatus);
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    transaction_id: payload.transaction_id
                        ? String(payload.transaction_id)
                        : payment.transaction_id,
                    payment_type: payload.payment_type
                        ? String(payload.payment_type)
                        : payment.payment_type,
                    status: paymentStatus,
                    fraud_status: fraudStatus,
                    raw_response: payload,
                    paid_at: isSuccess ? new Date() : payment.paid_at,
                    expired_at: isExpired ? new Date() : payment.expired_at,
                },
                include: {
                    booking: true,
                },
            });
            await tx.paymentEvent.create({
                data: {
                    payment_id: payment.id,
                    event_type: transactionStatus,
                    status: paymentStatus,
                    payload,
                },
            });
            if (isSuccess) {
                await tx.booking.update({
                    where: {
                        id: payment.booking_id,
                    },
                    data: {
                        status: 'paid',
                    },
                });
            }
            else if (isExpired) {
                await tx.booking.update({
                    where: {
                        id: payment.booking_id,
                    },
                    data: {
                        status: 'expired',
                        expired_at: new Date(),
                    },
                });
            }
            else if (isFailed) {
                await tx.booking.update({
                    where: {
                        id: payment.booking_id,
                    },
                    data: {
                        status: 'waiting_payment',
                    },
                });
            }
            return updatedPayment;
        });
        const mappedPayment = mapPayment(result);
        if (isSuccess) {
            await this.notificationsService.createNotification({
                userId: Number(result.booking.customer_id),
                type: 'payment_success',
                title: 'Pembayaran Berhasil',
                body: `Pembayaran untuk booking ${result.booking.booking_code} berhasil diterima.`,
                data: {
                    booking_id: Number(result.booking.id),
                    booking_code: result.booking.booking_code,
                    payment_id: mappedPayment.id,
                    status: mappedPayment.status,
                },
                sendPush: true,
            });
            await this.notifyAdmins({
                type: 'payment_success',
                title: 'Pembayaran Customer Berhasil',
                body: `Pembayaran booking ${result.booking.booking_code} telah berhasil.`,
                data: {
                    booking_id: Number(result.booking.id),
                    booking_code: result.booking.booking_code,
                    payment_id: mappedPayment.id,
                    status: mappedPayment.status,
                },
            });
        }
        if (isExpired || isFailed) {
            await this.notificationsService.createNotification({
                userId: Number(result.booking.customer_id),
                type: 'payment_failed',
                title: 'Pembayaran Belum Berhasil',
                body: `Pembayaran untuk booking ${result.booking.booking_code} belum berhasil. Silakan coba kembali.`,
                data: {
                    booking_id: Number(result.booking.id),
                    booking_code: result.booking.booking_code,
                    payment_id: mappedPayment.id,
                    status: mappedPayment.status,
                },
                sendPush: true,
            });
        }
        return mappedPayment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map