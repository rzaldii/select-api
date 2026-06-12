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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function mapReview(review) {
    return {
        id: Number(review.id),
        booking_id: Number(review.booking_id),
        item_id: Number(review.item_id),
        user_id: Number(review.user_id),
        rating: review.rating,
        comment: review.comment,
        media_bucket: review.media_bucket,
        media_path: review.media_path,
        is_visible: review.is_visible,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user: review.user
            ? {
                id: Number(review.user.id),
                full_name: review.user.full_name,
                avatar_path: review.user.avatar_path,
            }
            : null,
        item: review.item
            ? {
                id: Number(review.item.id),
                name: review.item.name,
                slug: review.item.slug,
            }
            : null,
        booking: review.booking
            ? {
                id: Number(review.booking.id),
                booking_code: review.booking.booking_code,
                status: review.booking.status,
            }
            : null,
    };
}
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReview(bookingId, itemId, user, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: BigInt(bookingId),
            },
            include: {
                booking_items: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking tidak ditemukan');
        }
        if (Number(booking.customer_id) !== user.profile.id) {
            throw new common_1.ForbiddenException('Tidak boleh memberi review untuk booking ini');
        }
        if (booking.status !== 'completed') {
            throw new common_1.BadRequestException('Review hanya bisa diberikan setelah booking selesai');
        }
        const itemIsInBooking = booking.booking_items.some((bookingItem) => Number(bookingItem.item_id) === itemId);
        if (!itemIsInBooking) {
            throw new common_1.BadRequestException('Barang tidak termasuk dalam booking ini');
        }
        const existingReview = await this.prisma.review.findUnique({
            where: {
                booking_id_item_id_user_id: {
                    booking_id: BigInt(bookingId),
                    item_id: BigInt(itemId),
                    user_id: BigInt(user.profile.id),
                },
            },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('Review untuk barang pada booking ini sudah dibuat');
        }
        const review = await this.prisma.review.create({
            data: {
                booking_id: BigInt(bookingId),
                item_id: BigInt(itemId),
                user_id: BigInt(user.profile.id),
                rating: dto.rating,
                comment: dto.comment,
                media_bucket: dto.media_bucket,
                media_path: dto.media_path,
                is_visible: true,
            },
            include: {
                user: true,
                item: true,
                booking: true,
            },
        });
        return mapReview(review);
    }
    async findItemReviews(itemId) {
        const item = await this.prisma.item.findFirst({
            where: {
                id: BigInt(itemId),
                is_active: true,
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Barang tidak ditemukan');
        }
        const reviews = await this.prisma.review.findMany({
            where: {
                item_id: BigInt(itemId),
                is_visible: true,
            },
            include: {
                user: true,
                item: true,
                booking: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((total, review) => total + review.rating, 0) /
                reviews.length
            : 0;
        return {
            item_id: itemId,
            average_rating: Number(averageRating.toFixed(2)),
            total_reviews: reviews.length,
            reviews: reviews.map(mapReview),
        };
    }
    async findMyReviews(user) {
        const reviews = await this.prisma.review.findMany({
            where: {
                user_id: BigInt(user.profile.id),
            },
            include: {
                user: true,
                item: true,
                booking: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return reviews.map(mapReview);
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map