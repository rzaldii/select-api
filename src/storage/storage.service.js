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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const PUBLIC_BUCKETS = ['item-images', 'profile-photos'];
let StorageService = class StorageService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    getStoragePathPrefix(user) {
        return `users/${user.profile.id}`;
    }
    isPublicBucket(bucket) {
        return PUBLIC_BUCKETS.includes(bucket);
    }
    validatePath(path) {
        if (path.startsWith('/')) {
            throw new common_1.BadRequestException('Path tidak boleh diawali slash');
        }
        if (path.includes('..')) {
            throw new common_1.BadRequestException('Path tidak boleh mengandung ..');
        }
    }
    async createSignedUploadUrl(dto, user) {
        this.validatePath(dto.path);
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.storage
            .from(dto.bucket)
            .createSignedUploadUrl(dto.path, {
            upsert: dto.upsert ?? false,
        });
        if (error) {
            throw new common_1.BadRequestException({
                message: 'Gagal membuat signed upload URL',
                supabase_error: error.message,
            });
        }
        return {
            bucket: dto.bucket,
            path: dto.path,
            signed_url: data.signedUrl,
            token: data.token,
            full_path: data.path,
            content_type: dto.content_type ?? null,
            expires_in_note: 'Signed upload URL berlaku sekitar 2 jam',
            owner_hint: this.getStoragePathPrefix(user),
        };
    }
    async createSignedReadUrl(dto) {
        this.validatePath(dto.path);
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.storage
            .from(dto.bucket)
            .createSignedUrl(dto.path, dto.expires_in ?? 3600);
        if (error) {
            throw new common_1.NotFoundException({
                message: 'Gagal membuat signed read URL',
                supabase_error: error.message,
            });
        }
        return {
            bucket: dto.bucket,
            path: dto.path,
            signed_url: data.signedUrl,
            expires_in: dto.expires_in ?? 3600,
        };
    }
    getPublicUrl(bucket, path) {
        this.validatePath(path);
        if (!this.isPublicBucket(bucket)) {
            throw new common_1.BadRequestException('Public URL hanya boleh dibuat untuk bucket public');
        }
        const supabase = this.supabaseService.getAdminClient();
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return {
            bucket,
            path,
            public_url: data.publicUrl,
        };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], StorageService);
//# sourceMappingURL=storage.service.js.map