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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const BLOCKING_BOOKING_STATUSES = [
    'pending_verification',
    'waiting_payment',
    'payment_pending',
    'paid',
    'approved',
    'ongoing',
];
const SERVICE_FEE = 10000;
function toDateOnly(date) {
    return new Date(`${date}T00:00:00.000Z`);
}
function countRentalDays(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / oneDay) + 1;
}
function generateBookingCode() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SEL-${Date.now()}-${random}`;
}
function mapBooking(booking) {
    return {
        id: Number(booking.id),
        booking_code: booking.booking_code,
        customer: booking.customer
            ? {
                id: Number(booking.customer.id),
                full_name: booking.customer.full_name,
                email: booking.customer.email,
                phone: booking.customer.phone,
            }
            : null,
        rental_start_date: booking.rental_start_date,
        rental_end_date: booking.rental_end_date,
        total_days: booking.total_days,
        subtotal_amount: Number(booking.subtotal_amount),
        service_fee: Number(booking.service_fee),
        total_amount: Number(booking.total_amount),
        status: booking.status,
        customer_note: booking.customer_note,
        admin_note: booking.admin_note,
        approved_by: booking.approved_by ? Number(booking.approved_by) : null,
        approved_at: booking.approved_at,
        rejected_by: booking.rejected_by ? Number(booking.rejected_by) : null,
        rejected_at: booking.rejected_at,
        cancelled_at: booking.cancelled_at,
        expired_at: booking.expired_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        items: booking.booking_items?.map((bookingItem) => {
            const item = bookingItem.item;
            const primaryImage = item?.images?.find((image) => image.is_primary) ??
                item?.images?.[0];
            return {
                id: Number(bookingItem.id),
                item_id: Number(bookingItem.item_id),
                item_name_snapshot: bookingItem.item_name_snapshot,
                daily_price_snapshot: Number(bookingItem.daily_price_snapshot),
                rental_start_date: bookingItem.rental_start_date,
                rental_end_date: bookingItem.rental_end_date,
                line_total: bookingItem.line_total !== null &&
                    bookingItem.line_total !== undefined
                    ? Number(bookingItem.line_total)
                    : null,
                item: item
                    ? {
                        id: Number(item.id),
                        name: item.name,
                        slug: item.slug,
                        brand: item.brand,
                        model: item.model,
                        serial_number: item.serial_number,
                        status: item.status,
                        primary_image: primaryImage
                            ? {
                                id: Number(primaryImage.id),
                                public_url: primaryImage.public_url,
                                storage_path: primaryImage.storage_path,
                            }
                            : null,
                    }
                    : null,
            };
        }) ?? [],
    };
}
let BookingsService = class BookingsService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    validateDateRange(startDate, endDate) {
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            throw new common_1.BadRequestException('Format tanggal tidak valid');
        }
        if (startDate > endDate) {
            throw new common_1.BadRequestException('Tanggal mulai sewa tidak boleh lebih besar dari tanggal selesai');
        }
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
    async validateConditionVerificationComplete(params) {
        const bookingItems = await this.prisma.bookingItem.findMany({
            where: {
                booking_id: params.bookingId,
            },
            select: {
                item_id: true,
                item_name_snapshot: true,
            },
        });
        const verifications = await this.prisma.conditionVerification.findMany({
            where: {
                booking_id: params.bookingId,
                type: params.type,
                status: 'approved',
            },
            select: {
                item_id: true,
            },
        });
        const approvedItemIds = verifications.map((item) => Number(item.item_id));
        const missingItems = bookingItems.filter((item) => !approvedItemIds.includes(Number(item.item_id)));
        if (missingItems.length > 0) {
            const label = params.type === 'before_rent' ? 'sebelum sewa' : 'setelah sewa';
            throw new common_1.BadRequestException({
                message: `Foto kondisi barang ${label} belum lengkap atau belum disetujui admin`,
                missing_items: missingItems.map((item) => ({
                    item_id: Number(item.item_id),
                    item_name: item.item_name_snapshot,
                })),
            });
        }
    }
    async findUnavailableItemIds(itemIds, startDate, endDate) {
        const blockingBookings = await this.prisma.bookingItem.findMany({
            where: {
                item_id: {
                    in: itemIds.map((id) => BigInt(id)),
                },
                booking: {
                    status: {
                        in: [...BLOCKING_BOOKING_STATUSES],
                    },
                    rental_start_date: {
                        lte: endDate,
                    },
                    rental_end_date: {
                        gte: startDate,
                    },
                },
            },
            select: {
                item_id: true,
            },
        });
        return [...new Set(blockingBookings.map((item) => Number(item.item_id)))];
    }
    async checkAvailability(dto) {
        const startDate = toDateOnly(dto.rental_start_date);
        const endDate = toDateOnly(dto.rental_end_date);
        this.validateDateRange(startDate, endDate);
        const items = await this.prisma.item.findMany({
            where: {
                id: {
                    in: dto.item_ids.map((id) => BigInt(id)),
                },
                is_active: true,
                status: {
                    notIn: ['maintenance', 'inactive'],
                },
            },
            select: {
                id: true,
                name: true,
                status: true,
            },
        });
        const foundItemIds = items.map((item) => Number(item.id));
        const notFoundItemIds = dto.item_ids.filter((id) => !foundItemIds.includes(id));
        const unavailableItemIds = await this.findUnavailableItemIds(foundItemIds, startDate, endDate);
        const result = dto.item_ids.map((itemId) => {
            const item = items.find((row) => Number(row.id) === itemId);
            if (!item) {
                return {
                    item_id: itemId,
                    item_name: null,
                    is_available: false,
                    reason: 'Barang tidak ditemukan, tidak aktif, atau maintenance',
                };
            }
            const isAvailable = !unavailableItemIds.includes(itemId);
            return {
                item_id: itemId,
                item_name: item.name,
                is_available: isAvailable,
                reason: isAvailable ? null : 'Barang bentrok dengan booking lain',
            };
        });
        return {
            is_available: result.every((item) => item.is_available),
            rental_start_date: dto.rental_start_date,
            rental_end_date: dto.rental_end_date,
            not_found_item_ids: notFoundItemIds,
            items: result,
        };
    }
    async createBooking(dto, user) {
        const startDate = toDateOnly(dto.rental_start_date);
        const endDate = toDateOnly(dto.rental_end_date);
        this.validateDateRange(startDate, endDate);
        const rentalDays = countRentalDays(startDate, endDate);
        const items = await this.prisma.item.findMany({
            where: {
                id: {
                    in: dto.item_ids.map((id) => BigInt(id)),
                },
                is_active: true,
                status: {
                    notIn: ['maintenance', 'inactive'],
                },
            },
            include: {
                category: true,
                images: true,
            },
        });
        if (items.length !== dto.item_ids.length) {
            throw new common_1.BadRequestException('Ada barang yang tidak ditemukan, tidak aktif, atau maintenance');
        }
        const unavailableItemIds = await this.findUnavailableItemIds(dto.item_ids, startDate, endDate);
        if (unavailableItemIds.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Ada barang yang tidak tersedia pada rentang tanggal tersebut',
                unavailable_item_ids: unavailableItemIds,
            });
        }
        const subtotal = items.reduce((total, item) => {
            return total + Number(item.daily_price) * rentalDays;
        }, 0);
        const totalAmount = subtotal + SERVICE_FEE;
        try {
            const booking = await this.prisma.$transaction(async (tx) => {
                const createdBooking = await tx.booking.create({
                    data: {
                        booking_code: generateBookingCode(),
                        customer_id: BigInt(user.profile.id),
                        rental_start_date: startDate,
                        rental_end_date: endDate,
                        subtotal_amount: subtotal,
                        service_fee: SERVICE_FEE,
                        total_amount: totalAmount,
                        status: 'pending_verification',
                        customer_note: dto.customer_note,
                    },
                });
                await tx.bookingItem.createMany({
                    data: items.map((item) => ({
                        booking_id: createdBooking.id,
                        item_id: item.id,
                        item_name_snapshot: item.name,
                        daily_price_snapshot: item.daily_price,
                        rental_start_date: startDate,
                        rental_end_date: endDate,
                    })),
                });
                return tx.booking.findUniqueOrThrow({
                    where: {
                        id: createdBooking.id,
                    },
                    include: {
                        customer: true,
                        booking_items: {
                            include: {
                                item: {
                                    include: {
                                        images: true,
                                    },
                                },
                            },
                        },
                    },
                });
            });
            const mappedBooking = mapBooking(booking);
            await this.notifyAdmins({
                type: 'booking_created',
                title: 'Booking Baru Masuk',
                body: `${user.profile.full_name} membuat booking ${mappedBooking.booking_code}.`,
                data: {
                    booking_id: mappedBooking.id,
                    booking_code: mappedBooking.booking_code,
                    status: mappedBooking.status,
                },
            });
            return mappedBooking;
        }
        catch (error) {
            if (String(error?.message ?? '').includes('Barang sedang tidak tersedia pada rentang tanggal tersebut')) {
                throw new common_1.BadRequestException('Barang sedang tidak tersedia pada rentang tanggal tersebut');
            }
            throw error;
        }
    }
    async findMyBookings(user, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            customer_id: BigInt(user.profile.id),
        };
        if (query.status) {
            where.status = query.status;
        }
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                include: {
                    customer: true,
                    booking_items: {
                        include: {
                            item: {
                                include: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.booking.count({ where }),
        ]);
        return {
            bookings: bookings.map(mapBooking),
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, user) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
            include: {
                customer: true,
                booking_items: {
                    include: {
                        item: {
                            include: {
                                images: true,
                            },
                        },
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
            throw new common_1.ForbiddenException('Tidak boleh mengakses booking ini');
        }
        return mapBooking(booking);
    }
    async cancelBooking(id, user, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (Number(booking.customer_id) !== user.profile.id) {
            throw new common_1.ForbiddenException('Tidak boleh membatalkan booking ini');
        }
        if (!['pending_verification', 'waiting_payment', 'payment_pending'].includes(booking.status)) {
            throw new common_1.BadRequestException('Booking dengan status ini tidak bisa dibatalkan customer');
        }
        const updatedBooking = await this.prisma.booking.update({
            where: {
                id: BigInt(id),
            },
            data: {
                status: 'cancelled',
                admin_note: dto.note ?? booking.admin_note,
                cancelled_at: new Date(),
            },
            include: {
                customer: true,
                booking_items: {
                    include: {
                        item: {
                            include: {
                                images: true,
                            },
                        },
                    },
                },
            },
        });
        await this.notifyAdmins({
            type: 'system',
            title: 'Booking Dibatalkan',
            body: `${updatedBooking.customer?.full_name ?? 'Customer'} membatalkan booking ${updatedBooking.booking_code}.`,
            data: {
                booking_id: Number(updatedBooking.id),
                booking_code: updatedBooking.booking_code,
                status: updatedBooking.status,
                note: dto.note,
            },
        });
        return mapBooking(updatedBooking);
    }
    async findAllForAdmin(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                include: {
                    customer: true,
                    booking_items: {
                        include: {
                            item: {
                                include: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.booking.count({ where }),
        ]);
        return {
            bookings: bookings.map(mapBooking),
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async approveBooking(id, admin) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (booking.status !== 'paid') {
            throw new common_1.BadRequestException('Booking hanya bisa disetujui setelah pembayaran berhasil');
        }
        const updatedBooking = await this.prisma.booking.update({
            where: {
                id: BigInt(id),
            },
            data: {
                status: 'approved',
                approved_by: BigInt(admin.profile.id),
                approved_at: new Date(),
            },
            include: {
                customer: true,
                booking_items: {
                    include: {
                        item: {
                            include: {
                                images: true,
                            },
                        },
                    },
                },
            },
        });
        await this.notificationsService.createNotification({
            userId: Number(updatedBooking.customer_id),
            type: 'booking_approved',
            title: 'Booking Disetujui',
            body: `Booking ${updatedBooking.booking_code} telah disetujui. Silakan lanjutkan proses pengambilan barang.`,
            data: {
                booking_id: Number(updatedBooking.id),
                booking_code: updatedBooking.booking_code,
                status: updatedBooking.status,
            },
            sendPush: true,
        });
        return mapBooking(updatedBooking);
    }
    async rejectBooking(id, admin, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
            throw new common_1.BadRequestException('Booking dengan status ini tidak bisa ditolak');
        }
        const updatedBooking = await this.prisma.booking.update({
            where: {
                id: BigInt(id),
            },
            data: {
                status: 'rejected',
                rejected_by: BigInt(admin.profile.id),
                rejected_at: new Date(),
                admin_note: dto.note,
            },
            include: {
                customer: true,
                booking_items: {
                    include: {
                        item: {
                            include: {
                                images: true,
                            },
                        },
                    },
                },
            },
        });
        await this.notificationsService.createNotification({
            userId: Number(updatedBooking.customer_id),
            type: 'booking_rejected',
            title: 'Booking Ditolak',
            body: `Booking ${updatedBooking.booking_code} ditolak oleh admin.`,
            data: {
                booking_id: Number(updatedBooking.id),
                booking_code: updatedBooking.booking_code,
                status: updatedBooking.status,
                note: dto.note,
            },
            sendPush: true,
        });
        return mapBooking(updatedBooking);
    }
    async startRental(id, admin, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
            include: {
                customer: true,
                booking_items: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (booking.status !== 'approved') {
            throw new common_1.BadRequestException('Sewa hanya bisa dimulai setelah booking berstatus approved');
        }
        await this.validateConditionVerificationComplete({
            bookingId: booking.id,
            type: 'before_rent',
        });
        const updatedBooking = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: {
                    id: booking.id,
                },
                data: {
                    status: 'ongoing',
                    admin_note: dto.note ?? booking.admin_note,
                },
                include: {
                    customer: true,
                    booking_items: {
                        include: {
                            item: {
                                include: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            });
            await tx.item.updateMany({
                where: {
                    id: {
                        in: booking.booking_items.map((item) => item.item_id),
                    },
                },
                data: {
                    status: 'rented',
                    updated_by: BigInt(admin.profile.id),
                },
            });
            return updated;
        });
        await this.notificationsService.createNotification({
            userId: Number(updatedBooking.customer_id),
            type: 'system',
            title: 'Sewa Dimulai',
            body: `Booking ${updatedBooking.booking_code} sudah dimulai. Barang sedang dalam masa sewa.`,
            data: {
                booking_id: Number(updatedBooking.id),
                booking_code: updatedBooking.booking_code,
                status: updatedBooking.status,
            },
            sendPush: true,
        });
        return mapBooking(updatedBooking);
    }
    async completeRental(id, admin, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(id),
            },
            include: {
                customer: true,
                booking_items: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (booking.status !== 'ongoing') {
            throw new common_1.BadRequestException('Sewa hanya bisa diselesaikan jika booking berstatus ongoing');
        }
        await this.validateConditionVerificationComplete({
            bookingId: booking.id,
            type: 'after_rent',
        });
        const updatedBooking = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: {
                    id: booking.id,
                },
                data: {
                    status: 'completed',
                    admin_note: dto.note ?? booking.admin_note,
                },
                include: {
                    customer: true,
                    booking_items: {
                        include: {
                            item: {
                                include: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            });
            await tx.item.updateMany({
                where: {
                    id: {
                        in: booking.booking_items.map((item) => item.item_id),
                    },
                },
                data: {
                    status: 'available',
                    updated_by: BigInt(admin.profile.id),
                },
            });
            return updated;
        });
        await this.notificationsService.createNotification({
            userId: Number(updatedBooking.customer_id),
            type: 'rental_completed',
            title: 'Sewa Selesai',
            body: `Booking ${updatedBooking.booking_code} telah selesai. Terima kasih telah menggunakan SELECT.`,
            data: {
                booking_id: Number(updatedBooking.id),
                booking_code: updatedBooking.booking_code,
                status: updatedBooking.status,
            },
            sendPush: true,
        });
        return mapBooking(updatedBooking);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map