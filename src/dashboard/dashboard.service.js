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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function mapRecentBooking(booking) {
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
        total_amount: Number(booking.total_amount),
        status: booking.status,
        created_at: booking.created_at,
        items: booking.booking_items?.map((bookingItem) => ({
            item_id: Number(bookingItem.item_id),
            item_name_snapshot: bookingItem.item_name_snapshot,
            daily_price_snapshot: Number(bookingItem.daily_price_snapshot),
            item: bookingItem.item
                ? {
                    id: Number(bookingItem.item.id),
                    name: bookingItem.item.name,
                    slug: bookingItem.item.slug,
                    brand: bookingItem.item.brand,
                    model: bookingItem.item.model,
                    status: bookingItem.item.status,
                }
                : null,
        })) ?? [],
    };
}
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary() {
        const [totalItems, totalUsers, totalCompletedBookings, totalActiveBookings, totalPendingVerification, totalWaitingPayment, totalPaidBookings, totalRevenue,] = await Promise.all([
            this.prisma.item.count({
                where: {
                    is_active: true,
                },
            }),
            this.prisma.profile.count({
                where: {
                    role: 'customer',
                    is_active: true,
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'completed',
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: {
                        in: ['approved', 'ongoing', 'paid'],
                    },
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'pending_verification',
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'waiting_payment',
                },
            }),
            this.prisma.booking.count({
                where: {
                    status: 'paid',
                },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: {
                        in: ['settlement', 'capture'],
                    },
                },
                _sum: {
                    gross_amount: true,
                },
            }),
        ]);
        return {
            total_items: totalItems,
            total_users: totalUsers,
            total_completed_bookings: totalCompletedBookings,
            total_active_bookings: totalActiveBookings,
            total_pending_verification: totalPendingVerification,
            total_waiting_payment: totalWaitingPayment,
            total_paid_bookings: totalPaidBookings,
            total_revenue: totalRevenue._sum.gross_amount
                ? Number(totalRevenue._sum.gross_amount)
                : 0,
        };
    }
    async getTopItems(limit = 3) {
        const bookingItems = await this.prisma.bookingItem.findMany({
            where: {
                booking: {
                    status: {
                        in: ['approved', 'ongoing', 'completed'],
                    },
                },
            },
            include: {
                item: {
                    include: {
                        images: true,
                        category: true,
                    },
                },
                booking: true,
            },
        });
        const grouped = new Map();
        for (const bookingItem of bookingItems) {
            const itemId = Number(bookingItem.item_id);
            const item = bookingItem.item;
            const primaryImage = item?.images?.find((image) => image.is_primary) ??
                item?.images?.[0];
            const existing = grouped.get(itemId);
            if (existing) {
                existing.total_booked += 1;
                existing.total_revenue_estimate += bookingItem.line_total
                    ? Number(bookingItem.line_total)
                    : Number(bookingItem.daily_price_snapshot) *
                        Number(bookingItem.booking.total_days ?? 1);
            }
            else {
                grouped.set(itemId, {
                    item_id: itemId,
                    item_name: item?.name ?? bookingItem.item_name_snapshot,
                    slug: item?.slug ?? '',
                    brand: item?.brand ?? null,
                    model: item?.model ?? null,
                    category: item?.category
                        ? {
                            id: Number(item.category.id),
                            name: item.category.name,
                            slug: item.category.slug,
                        }
                        : null,
                    total_booked: 1,
                    total_revenue_estimate: bookingItem.line_total
                        ? Number(bookingItem.line_total)
                        : Number(bookingItem.daily_price_snapshot) *
                            Number(bookingItem.booking.total_days ?? 1),
                    primary_image: primaryImage
                        ? {
                            id: Number(primaryImage.id),
                            public_url: primaryImage.public_url,
                            storage_path: primaryImage.storage_path,
                        }
                        : null,
                });
            }
        }
        return Array.from(grouped.values())
            .sort((a, b) => b.total_booked - a.total_booked)
            .slice(0, limit);
    }
    async getRecentBookings(limit = 5) {
        const bookings = await this.prisma.booking.findMany({
            include: {
                customer: true,
                booking_items: {
                    include: {
                        item: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
            take: limit,
        });
        return bookings.map(mapRecentBooking);
    }
    async getBookingStatusDistribution() {
        const statuses = [
            'pending_verification',
            'waiting_payment',
            'payment_pending',
            'paid',
            'approved',
            'rejected',
            'ongoing',
            'completed',
            'cancelled',
            'expired',
        ];
        const result = await Promise.all(statuses.map(async (status) => ({
            status,
            total: await this.prisma.booking.count({
                where: {
                    status,
                },
            }),
        })));
        return result;
    }
    async getDashboard(query) {
        const topItemLimit = query.top_item_limit ?? 3;
        const recentBookingLimit = query.recent_booking_limit ?? 5;
        const [summary, topItems, recentBookings, bookingStatusDistribution,] = await Promise.all([
            this.getSummary(),
            this.getTopItems(topItemLimit),
            this.getRecentBookings(recentBookingLimit),
            this.getBookingStatusDistribution(),
        ]);
        return {
            summary,
            top_items: topItems,
            recent_bookings: recentBookings,
            booking_status_distribution: bookingStatusDistribution,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map