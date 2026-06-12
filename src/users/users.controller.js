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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const update_me_dto_1 = require("./dto/update-me.dto");
const update_user_role_dto_1 = require("./dto/update-user-role.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(user) {
        return {
            success: true,
            message: 'Profil berhasil diambil',
            data: await this.usersService.getMe(user.profile.id),
        };
    }
    async updateMe(user, dto) {
        return {
            success: true,
            message: 'Profil berhasil diperbarui',
            data: await this.usersService.updateMe(user.profile.id, dto),
        };
    }
    async findAllUsers() {
        return {
            success: true,
            message: 'Data user berhasil diambil',
            data: await this.usersService.findAllUsers(),
        };
    }
    async updateUserRole(id, dto) {
        return {
            success: true,
            message: 'Role user berhasil diperbarui',
            data: await this.usersService.updateUserRole(id, dto),
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('users/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengambil profil user yang sedang login' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('users/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah profil user yang sedang login' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_me_dto_1.UpdateMeDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin melihat semua user' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Patch)('admin/users/:id/role'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin mengubah role user' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 2 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_role_dto_1.UpdateUserRoleDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserRole", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map