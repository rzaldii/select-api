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
exports.VerificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_condition_verification_dto_1 = require("./dto/create-condition-verification.dto");
const create_identity_verification_dto_1 = require("./dto/create-identity-verification.dto");
const reject_verification_dto_1 = require("./dto/reject-verification.dto");
const verifications_service_1 = require("./verifications.service");
let VerificationsController = class VerificationsController {
    constructor(verificationsService) {
        this.verificationsService = verificationsService;
    }
    async submitIdentityVerification(user, dto) {
        return {
            success: true,
            message: 'Verifikasi identitas berhasil dikirim',
            data: await this.verificationsService.submitIdentityVerification(dto, user),
        };
    }
    async submitConditionVerification(user, dto) {
        return {
            success: true,
            message: 'Verifikasi kondisi barang berhasil dikirim',
            data: await this.verificationsService.submitConditionVerification(dto, user),
        };
    }
    async findIdentityVerificationsForAdmin() {
        return {
            success: true,
            message: 'Data verifikasi identitas berhasil diambil',
            data: await this.verificationsService.findIdentityVerificationsForAdmin(),
        };
    }
    async findConditionVerificationsForAdmin() {
        return {
            success: true,
            message: 'Data verifikasi kondisi barang berhasil diambil',
            data: await this.verificationsService.findConditionVerificationsForAdmin(),
        };
    }
    async approveIdentityVerification(user, id) {
        return {
            success: true,
            message: 'Verifikasi identitas berhasil disetujui',
            data: await this.verificationsService.approveIdentityVerification(id, user),
        };
    }
    async rejectIdentityVerification(user, id, dto) {
        return {
            success: true,
            message: 'Verifikasi identitas berhasil ditolak',
            data: await this.verificationsService.rejectIdentityVerification(id, user, dto),
        };
    }
    async approveConditionVerification(user, id) {
        return {
            success: true,
            message: 'Verifikasi kondisi barang berhasil disetujui',
            data: await this.verificationsService.approveConditionVerification(id, user),
        };
    }
    async rejectConditionVerification(user, id, dto) {
        return {
            success: true,
            message: 'Verifikasi kondisi barang berhasil ditolak',
            data: await this.verificationsService.rejectConditionVerification(id, user, dto),
        };
    }
};
exports.VerificationsController = VerificationsController;
__decorate([
    (0, common_1.Post)('verifications/identity'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer mengirim verifikasi KTP + GPS' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_identity_verification_dto_1.CreateIdentityVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "submitIdentityVerification", null);
__decorate([
    (0, common_1.Post)('verifications/condition'),
    (0, swagger_1.ApiOperation)({
        summary: 'Customer mengirim foto kondisi barang sebelum/sesudah sewa',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_condition_verification_dto_1.CreateConditionVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "submitConditionVerification", null);
__decorate([
    (0, common_1.Get)('admin/verifications/identity'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat semua verifikasi identitas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "findIdentityVerificationsForAdmin", null);
__decorate([
    (0, common_1.Get)('admin/verifications/condition'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat semua verifikasi kondisi barang' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "findConditionVerificationsForAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/verifications/identity/:id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menyetujui verifikasi identitas' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "approveIdentityVerification", null);
__decorate([
    (0, common_1.Patch)('admin/verifications/identity/:id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menolak verifikasi identitas' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, reject_verification_dto_1.RejectVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "rejectIdentityVerification", null);
__decorate([
    (0, common_1.Patch)('admin/verifications/condition/:id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menyetujui verifikasi kondisi barang' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "approveConditionVerification", null);
__decorate([
    (0, common_1.Patch)('admin/verifications/condition/:id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menolak verifikasi kondisi barang' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, reject_verification_dto_1.RejectVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationsController.prototype, "rejectConditionVerification", null);
exports.VerificationsController = VerificationsController = __decorate([
    (0, swagger_1.ApiTags)('Verifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [verifications_service_1.VerificationsService])
], VerificationsController);
//# sourceMappingURL=verifications.controller.js.map