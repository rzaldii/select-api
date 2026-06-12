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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_review_dto_1 = require("./dto/create-review.dto");
const reviews_service_1 = require("./reviews.service");
let ReviewsController = class ReviewsController {
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    async createReview(user, bookingId, itemId, dto) {
        return {
            success: true,
            message: 'Review berhasil dibuat',
            data: await this.reviewsService.createReview(bookingId, itemId, user, dto),
        };
    }
    async findItemReviews(itemId) {
        return {
            success: true,
            message: 'Review barang berhasil diambil',
            data: await this.reviewsService.findItemReviews(itemId),
        };
    }
    async findMyReviews(user) {
        return {
            success: true,
            message: 'Review saya berhasil diambil',
            data: await this.reviewsService.findMyReviews(user),
        };
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Post)('bookings/:bookingId/items/:itemId/reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Customer memberi review barang setelah booking selesai' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 1 }),
    (0, swagger_1.ApiParam)({ name: 'itemId', example: 2 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "createReview", null);
__decorate([
    (0, common_1.Get)('items/:itemId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat review pada barang tertentu' }),
    (0, swagger_1.ApiParam)({ name: 'itemId', example: 1 }),
    __param(0, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "findItemReviews", null);
__decorate([
    (0, common_1.Get)('reviews/my'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Customer melihat review yang pernah dibuat' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "findMyReviews", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map