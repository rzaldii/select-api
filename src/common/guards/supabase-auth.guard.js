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
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const supabase_service_1 = require("../../supabase/supabase.service");
const profile_mapper_1 = require("../mappers/profile.mapper");
let SupabaseAuthGuard = class SupabaseAuthGuard {
    constructor(prisma, supabaseService) {
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Token tidak ditemukan');
        }
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Token tidak valid');
        }
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            throw new common_1.UnauthorizedException('Token Supabase tidak valid');
        }
        const authUser = data.user;
        const email = authUser.email ?? null;
        let profile = await this.prisma.profile.findFirst({
            where: {
                auth_user_id: authUser.id,
            },
        });
        if (!profile && email) {
            const existingEmailProfile = await this.prisma.profile.findUnique({
                where: {
                    email,
                },
            });
            if (existingEmailProfile && !existingEmailProfile.auth_user_id) {
                profile = await this.prisma.profile.update({
                    where: {
                        id: existingEmailProfile.id,
                    },
                    data: {
                        auth_user_id: authUser.id,
                    },
                });
            }
            else if (existingEmailProfile?.auth_user_id) {
                throw new common_1.UnauthorizedException('Email sudah terhubung dengan akun lain');
            }
        }
        if (!profile) {
            const metadata = authUser.user_metadata ?? {};
            const fallbackName = metadata.full_name ||
                metadata.name ||
                email?.split('@')[0] ||
                'Customer SELECT';
            profile = await this.prisma.profile.create({
                data: {
                    auth_user_id: authUser.id,
                    full_name: String(fallbackName),
                    email: email ?? `${authUser.id}@select.local`,
                    role: 'customer',
                    is_active: true,
                },
            });
        }
        if (!profile.is_active) {
            throw new common_1.ForbiddenException('Akun tidak aktif');
        }
        request.user = {
            authUserId: authUser.id,
            email,
            profile: (0, profile_mapper_1.mapProfile)(profile),
        };
        return true;
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map