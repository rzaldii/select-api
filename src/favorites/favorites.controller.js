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
exports.FavoritesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const favorites_service_1 = require("./favorites.service");
let FavoritesController = class FavoritesController {
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    async addFavorite(user, itemId) {
        return {
            success: true,
            message: 'Barang berhasil ditambahkan ke favorit',
            data: await this.favoritesService.addFavorite(itemId, user),
        };
    }
    async removeFavorite(user, itemId) {
        return {
            success: true,
            message: 'Barang berhasil dihapus dari favorit',
            data: await this.favoritesService.removeFavorite(itemId, user),
        };
    }
    async findMyFavorites(user) {
        return {
            success: true,
            message: 'Data favorit berhasil diambil',
            data: await this.favoritesService.findMyFavorites(user),
        };
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, common_1.Post)(':itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer menambahkan barang ke favorit' }),
    (0, swagger_1.ApiParam)({ name: 'itemId', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "addFavorite", null);
__decorate([
    (0, common_1.Delete)(':itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer menghapus barang dari favorit' }),
    (0, swagger_1.ApiParam)({ name: 'itemId', example: 1 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "removeFavorite", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer melihat daftar favorit miliknya' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "findMyFavorites", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, swagger_1.ApiTags)('Favorites'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('favorites'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
//# sourceMappingURL=favorites.controller.js.map