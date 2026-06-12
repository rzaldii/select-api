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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const supabase_service_1 = require("../supabase/supabase.service");
const profile_mapper_1 = require("../common/mappers/profile.mapper");
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function mapAuthResponse(params) {
    return {
        user: {
            id: params.user.id,
            email: params.user.email,
        },
        profile: (0, profile_mapper_1.mapProfile)(params.profile),
        session: params.session
            ? {
                access_token: params.session.access_token,
                refresh_token: params.session.refresh_token,
                expires_in: params.session.expires_in,
                expires_at: params.session.expires_at,
                token_type: params.session.token_type,
            }
            : null,
    };
}
let AuthService = class AuthService {
    constructor(prisma, supabaseService) {
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    async syncProfile(params) {
        const email = normalizeEmail(params.email);
        let profile = await this.prisma.profile.findFirst({
            where: {
                auth_user_id: params.authUserId,
            },
        });
        if (profile) {
            const shouldUpdateFullName = params.fullName && params.fullName.trim() && profile.full_name !== params.fullName.trim();
            const shouldUpdatePhone = params.phone && params.phone.trim() && profile.phone !== params.phone.trim();
            if (shouldUpdateFullName || shouldUpdatePhone) {
                return this.prisma.profile.update({
                    where: {
                        id: profile.id,
                    },
                    data: {
                        ...(shouldUpdateFullName
                            ? {
                                full_name: params.fullName.trim(),
                            }
                            : {}),
                        ...(shouldUpdatePhone
                            ? {
                                phone: params.phone.trim(),
                            }
                            : {}),
                    },
                });
            }
            return profile;
        }
        const existingEmailProfile = await this.prisma.profile.findUnique({
            where: {
                email,
            },
        });
        if (existingEmailProfile && !existingEmailProfile.auth_user_id) {
            return this.prisma.profile.update({
                where: {
                    id: existingEmailProfile.id,
                },
                data: {
                    auth_user_id: params.authUserId,
                    full_name: params.fullName ?? existingEmailProfile.full_name,
                    phone: params.phone ?? existingEmailProfile.phone,
                },
            });
        }
        if (existingEmailProfile?.auth_user_id) {
            throw new common_1.ConflictException('Email sudah terhubung dengan akun lain');
        }
        profile = await this.prisma.profile.create({
            data: {
                auth_user_id: params.authUserId,
                email,
                full_name: params.fullName?.trim() || email.split('@')[0],
                phone: params.phone?.trim() || null,
                role: 'customer',
                is_active: true,
            },
        });
        return profile;
    }
    async findAuthUserByEmail(email) {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        const targetEmail = normalizeEmail(email);
        for (let page = 1; page <= 10; page++) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage: 100,
            });
            if (error) {
                throw new common_1.BadRequestException(error.message);
            }
            const users = data.users ?? [];
            const foundUser = users.find((user) => {
                return normalizeEmail(user.email ?? '') == targetEmail;
            });
            if (foundUser) {
                return foundUser;
            }
            if (users.length < 100) {
                break;
            }
        }
        return null;
    }
    async register(dto) {
        const supabase = this.supabaseService.getClient();
        const email = normalizeEmail(dto.email);
        const fullName = dto.full_name.trim();
        const phone = dto.phone?.trim() || undefined;
        const existingProfile = await this.prisma.profile.findUnique({
            where: {
                email,
            },
        });
        if (existingProfile?.auth_user_id) {
            throw new common_1.ConflictException('Email sudah terdaftar. Silakan login.');
        }
        const emailRedirectTo = process.env.AUTH_EMAIL_REDIRECT_TO || 'select://auth/callback';
        const { data, error } = await supabase.auth.signUp({
            email,
            password: dto.password,
            options: {
                emailRedirectTo,
                data: {
                    full_name: fullName,
                    phone,
                },
            },
        });
        if (error) {
            const message = error.message.toLowerCase();
            if (message.includes('email rate limit exceeded')) {
                throw new common_1.HttpException('Batas pengiriman email verifikasi tercapai. Tunggu beberapa menit atau gunakan Custom SMTP di Supabase.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (message.includes('error sending confirmation email')) {
                throw new common_1.BadRequestException('Gagal mengirim email konfirmasi. Periksa konfigurasi Custom SMTP di Supabase.');
            }
            if (message.includes('already') ||
                message.includes('registered') ||
                message.includes('exists')) {
                throw new common_1.ConflictException('Email sudah terdaftar. Silakan login.');
            }
            if (message.includes('invalid')) {
                throw new common_1.BadRequestException('Email tidak valid.');
            }
            throw new common_1.BadRequestException(error.message);
        }
        let authUser = data.user;
        if (!authUser) {
            authUser = await this.findAuthUserByEmail(email);
        }
        if (!authUser) {
            throw new common_1.BadRequestException('Register berhasil di Supabase Auth, tetapi backend gagal mengambil data user. Coba login setelah konfirmasi email.');
        }
        const registeredEmail = authUser.email ?? email;
        const profile = await this.syncProfile({
            authUserId: authUser.id,
            email: registeredEmail,
            fullName,
            phone,
        });
        return {
            success: true,
            message: data.session
                ? 'Register berhasil'
                : 'Register berhasil. Silakan cek email untuk konfirmasi akun.',
            data: mapAuthResponse({
                user: authUser,
                session: data.session,
                profile,
            }),
        };
    }
    async login(dto) {
        const supabase = this.supabaseService.getClient();
        const email = normalizeEmail(dto.email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: dto.password,
        });
        if (error) {
            const message = error.message.toLowerCase();
            if (message.includes('email rate limit exceeded')) {
                throw new common_1.HttpException('Batas pengiriman email verifikasi tercapai. Tunggu beberapa menit atau gunakan SMTP sendiri di Supabase.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (message.includes('already') ||
                message.includes('registered') ||
                message.includes('exists')) {
                throw new common_1.ConflictException('Email sudah terdaftar. Silakan login.');
            }
            if (message.includes('invalid')) {
                throw new common_1.BadRequestException('Email tidak valid.');
            }
            throw new common_1.BadRequestException(error.message);
        }
        if (!data.user || !data.user.email || !data.session) {
            throw new common_1.UnauthorizedException('Login gagal');
        }
        const metadata = data.user.user_metadata ?? {};
        const profile = await this.syncProfile({
            authUserId: data.user.id,
            email: data.user.email,
            fullName: metadata.full_name ||
                metadata.name ||
                data.user.email.split('@')[0],
            phone: metadata.phone,
        });
        if (!profile.is_active) {
            throw new common_1.UnauthorizedException('Akun tidak aktif');
        }
        return {
            success: true,
            message: 'Login berhasil',
            data: mapAuthResponse({
                user: data.user,
                session: data.session,
                profile,
            }),
        };
    }
    async refreshToken(dto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: dto.refresh_token,
        });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        if (!data.user || !data.user.email || !data.session) {
            throw new common_1.UnauthorizedException('Refresh token gagal');
        }
        const profile = await this.syncProfile({
            authUserId: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email.split('@')[0],
            phone: data.user.user_metadata?.phone,
        });
        return {
            success: true,
            message: 'Token berhasil diperbarui',
            data: mapAuthResponse({
                user: data.user,
                session: data.session,
                profile,
            }),
        };
    }
    async me(user) {
        return {
            success: true,
            message: 'Data auth user berhasil diambil',
            data: {
                auth_user_id: user.authUserId,
                email: user.email,
                profile: user.profile,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map