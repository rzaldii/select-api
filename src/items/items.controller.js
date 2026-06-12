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
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_item_dto_1 = require("./dto/create-item.dto");
const item_query_dto_1 = require("./dto/item-query.dto");
const update_item_dto_1 = require("./dto/update-item.dto");
const items_service_1 = require("./items.service");
let ItemsController = class ItemsController {
    constructor(itemsService) {
        this.itemsService = itemsService;
    }
    async findCategories() {
        return {
            success: true,
            message: 'Kategori berhasil diambil',
            data: await this.itemsService.findCategories(),
        };
    }
    async findAll(query) {
        const result = await this.itemsService.findAll(query);
        return {
            success: true,
            message: 'Data barang berhasil diambil',
            data: result.items,
            meta: result.meta,
        };
    }
    async findOne(id) {
        return {
            success: true,
            message: 'Detail barang berhasil diambil',
            data: await this.itemsService.findOne(id),
        };
    }
    async create(user, dto) {
        return {
            success: true,
            message: 'Barang berhasil ditambahkan',
            data: await this.itemsService.create(dto, user.profile.id),
        };
    }
    async update(user, id, dto) {
        return {
            success: true,
            message: 'Barang berhasil diperbarui',
            data: await this.itemsService.update(id, dto, user.profile.id),
        };
    }
    async softDelete(user, id) {
        return {
            success: true,
            message: 'Barang berhasil dinonaktifkan',
            data: await this.itemsService.softDelete(id, user.profile.id),
        };
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat daftar kategori barang aktif' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "findCategories", null);
__decorate([
    (0, common_1.Get)('items'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat daftar barang elektronik' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_query_dto_1.ItemQueryDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat detail barang elektronik' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('admin/items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menambahkan barang elektronik' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_item_dto_1.CreateItemDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('admin/items/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin mengubah data barang elektronik' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_item_dto_1.UpdateItemDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('admin/items/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin menonaktifkan barang elektronik' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "softDelete", null);
exports.ItemsController = ItemsController = __decorate([
    (0, swagger_1.ApiTags)('Items'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [items_service_1.ItemsService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map