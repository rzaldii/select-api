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
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const create_signed_read_url_dto_1 = require("./dto/create-signed-read-url.dto");
const create_signed_upload_url_dto_1 = require("./dto/create-signed-upload-url.dto");
const storage_service_1 = require("./storage.service");
let StorageController = class StorageController {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async createSignedUploadUrl(user, dto) {
        return {
            success: true,
            message: 'Signed upload URL berhasil dibuat',
            data: await this.storageService.createSignedUploadUrl(dto, user),
        };
    }
    async createSignedReadUrl(dto) {
        return {
            success: true,
            message: 'Signed read URL berhasil dibuat',
            data: await this.storageService.createSignedReadUrl(dto),
        };
    }
    getPublicUrl(bucket, path) {
        return {
            success: true,
            message: 'Public URL berhasil dibuat',
            data: this.storageService.getPublicUrl(bucket, path),
        };
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('signed-upload-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat signed upload URL untuk upload file ke Supabase Storage',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_signed_upload_url_dto_1.CreateSignedUploadUrlDto]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "createSignedUploadUrl", null);
__decorate([
    (0, common_1.Post)('signed-read-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat signed read URL untuk membaca file private',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_signed_read_url_dto_1.CreateSignedReadUrlDto]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "createSignedReadUrl", null);
__decorate([
    (0, common_1.Get)('public-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Membuat public URL untuk bucket public',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'bucket',
        example: 'item-images',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'path',
        example: 'camera/sony-alpha-a7-iv/main.png',
    }),
    __param(0, (0, common_1.Query)('bucket')),
    __param(1, (0, common_1.Query)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StorageController.prototype, "getPublicUrl", null);
exports.StorageController = StorageController = __decorate([
    (0, swagger_1.ApiTags)('Storage'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('storage'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map