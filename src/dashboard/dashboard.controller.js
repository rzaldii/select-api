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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const dashboard_query_dto_1 = require("./dto/dashboard-query.dto");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getDashboard(query) {
        return {
            success: true,
            message: 'Dashboard berhasil diambil',
            data: await this.dashboardService.getDashboard(query),
        };
    }
    async getSummary() {
        return {
            success: true,
            message: 'Ringkasan dashboard berhasil diambil',
            data: await this.dashboardService.getSummary(),
        };
    }
    async getTopItems(query) {
        return {
            success: true,
            message: 'Top barang berhasil diambil',
            data: await this.dashboardService.getTopItems(query.top_item_limit ?? 3),
        };
    }
    async getRecentBookings(query) {
        return {
            success: true,
            message: 'Booking terbaru berhasil diambil',
            data: await this.dashboardService.getRecentBookings(query.recent_booking_limit ?? 5),
        };
    }
    async getBookingStatusDistribution() {
        return {
            success: true,
            message: 'Distribusi status booking berhasil diambil',
            data: await this.dashboardService.getBookingStatusDistribution(),
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat seluruh ringkasan dashboard' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_query_dto_1.DashboardQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat ringkasan statistik dashboard' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('top-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat barang paling sering disewa' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_query_dto_1.DashboardQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTopItems", null);
__decorate([
    (0, common_1.Get)('recent-bookings'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat aktivitas booking terbaru' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_query_dto_1.DashboardQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRecentBookings", null);
__decorate([
    (0, common_1.Get)('booking-status-distribution'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat distribusi status booking' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBookingStatusDistribution", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/dashboard'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map