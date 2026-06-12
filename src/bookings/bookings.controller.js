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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const bookings_service_1 = require("./bookings.service");
const booking_query_dto_1 = require("./dto/booking-query.dto");
const cancel_booking_dto_1 = require("./dto/cancel-booking.dto");
const check_availability_dto_1 = require("./dto/check-availability.dto");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const reject_booking_dto_1 = require("./dto/reject-booking.dto");
const update_rental_status_dto_1 = require("./dto/update-rental-status.dto");
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async checkAvailability(dto) {
        return {
            success: true,
            message: 'Ketersediaan barang berhasil dicek',
            data: await this.bookingsService.checkAvailability(dto),
        };
    }
    async createBooking(user, dto) {
        return {
            success: true,
            message: 'Booking berhasil dibuat',
            data: await this.bookingsService.createBooking(dto, user),
        };
    }
    async findMyBookings(user, query) {
        const result = await this.bookingsService.findMyBookings(user, query);
        return {
            success: true,
            message: 'Data booking berhasil diambil',
            data: result.bookings,
            meta: result.meta,
        };
    }
    async findOne(user, id) {
        return {
            success: true,
            message: 'Detail booking berhasil diambil',
            data: await this.bookingsService.findOne(id, user),
        };
    }
    async cancelBooking(user, id, dto) {
        return {
            success: true,
            message: 'Booking berhasil dibatalkan',
            data: await this.bookingsService.cancelBooking(id, user, dto),
        };
    }
    async findAllForAdmin(query) {
        const result = await this.bookingsService.findAllForAdmin(query);
        return {
            success: true,
            message: 'Data booking admin berhasil diambil',
            data: result.bookings,
            meta: result.meta,
        };
    }
    async approveBooking(user, id) {
        return {
            success: true,
            message: 'Booking berhasil disetujui',
            data: await this.bookingsService.approveBooking(id, user),
        };
    }
    async rejectBooking(user, id, dto) {
        return {
            success: true,
            message: 'Booking berhasil ditolak',
            data: await this.bookingsService.rejectBooking(id, user, dto),
        };
    }
    async startRental(user, id, dto) {
        return {
            success: true,
            message: 'Sewa berhasil dimulai',
            data: await this.bookingsService.startRental(id, user, dto),
        };
    }
    async completeRental(user, id, dto) {
        return {
            success: true,
            message: 'Sewa berhasil diselesaikan',
            data: await this.bookingsService.completeRental(id, user, dto),
        };
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)('bookings/check-availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Cek ketersediaan barang berdasarkan tanggal sewa' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_availability_dto_1.CheckAvailabilityDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Post)('bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Customer membuat booking penyewaan' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('bookings/my'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Customer melihat daftar booking miliknya' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, booking_query_dto_1.BookingQueryDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findMyBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat detail booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Customer membatalkan booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, cancel_booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Get)('admin/bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat semua data booking' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_query_dto_1.BookingQueryDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findAllForAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/bookings/:id/approve'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menyetujui booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "approveBooking", null);
__decorate([
    (0, common_1.Patch)('admin/bookings/:id/reject'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menolak booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, reject_booking_dto_1.RejectBookingDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "rejectBooking", null);
__decorate([
    (0, common_1.Patch)('admin/bookings/:id/start'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin memulai masa sewa booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_rental_status_dto_1.UpdateRentalStatusDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "startRental", null);
__decorate([
    (0, common_1.Patch)('admin/bookings/:id/complete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menyelesaikan masa sewa booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_rental_status_dto_1.UpdateRentalStatusDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "completeRental", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map