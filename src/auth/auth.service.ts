import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';

import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { mapProfile } from '../common/mappers/profile.mapper';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapAuthResponse(params: {
  user: User;
  session: any;
  profile: any;
}) {
  return {
    user: {
      id: params.user.id,
      email: params.user.email,
    },
    profile: mapProfile(params.profile),
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private async syncProfile(params: {
    authUserId: string;
    email: string;
    fullName?: string;
    phone?: string;
  }) {
    const email = normalizeEmail(params.email);

    let profile = await this.prisma.profile.findFirst({
      where: {
        auth_user_id: params.authUserId,
      },
    });

    if (profile) {
      const shouldUpdateFullName =
        params.fullName && params.fullName.trim() && profile.full_name !== params.fullName.trim();

      const shouldUpdatePhone =
        params.phone && params.phone.trim() && profile.phone !== params.phone.trim();

      if (shouldUpdateFullName || shouldUpdatePhone) {
        return this.prisma.profile.update({
          where: {
            id: profile.id,
          },
          data: {
            ...(shouldUpdateFullName
              ? {
                  full_name: params.fullName!.trim(),
                }
              : {}),
            ...(shouldUpdatePhone
              ? {
                  phone: params.phone!.trim(),
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
      throw new ConflictException('Email sudah terhubung dengan akun lain');
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

  private async findAuthUserByEmail(email: string): Promise<User | null> {
    const supabaseAdmin = this.supabaseService.getAdminClient();

    const targetEmail = normalizeEmail(email);

    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });

      if (error) {
        throw new BadRequestException(error.message);
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

  async register(dto: RegisterDto) {
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
      throw new ConflictException('Email sudah terdaftar. Silakan login.');
    }

    const emailRedirectTo =
      process.env.AUTH_EMAIL_REDIRECT_TO || 'select://auth/callback';

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
        throw new HttpException(
          'Batas pengiriman email verifikasi tercapai. Tunggu beberapa menit atau gunakan Custom SMTP di Supabase.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (message.includes('error sending confirmation email')) {
        throw new BadRequestException(
          'Gagal mengirim email konfirmasi. Periksa konfigurasi Custom SMTP di Supabase.',
        );
      }

      if (
        message.includes('already') ||
        message.includes('registered') ||
        message.includes('exists')
      ) {
        throw new ConflictException('Email sudah terdaftar. Silakan login.');
      }

      if (message.includes('invalid')) {
        throw new BadRequestException('Email tidak valid.');
      }

      throw new BadRequestException(error.message);
    }

    let authUser = data.user;

    if (!authUser) {
      authUser = await this.findAuthUserByEmail(email);
    }

    if (!authUser) {
      throw new BadRequestException(
        'Register berhasil di Supabase Auth, tetapi backend gagal mengambil data user. Coba login setelah konfirmasi email.',
      );
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

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const email = normalizeEmail(dto.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: dto.password,
    });

    if (error) {
  const message = error.message.toLowerCase();

  if (message.includes('email rate limit exceeded')) {
    throw new HttpException(
      'Batas pengiriman email verifikasi tercapai. Tunggu beberapa menit atau gunakan SMTP sendiri di Supabase.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  if (
      message.includes('already') ||
      message.includes('registered') ||
      message.includes('exists')
    ) {
      throw new ConflictException('Email sudah terdaftar. Silakan login.');
    }

    if (message.includes('invalid')) {
      throw new BadRequestException('Email tidak valid.');
    }

    throw new BadRequestException(error.message);
  }

    if (!data.user || !data.user.email || !data.session) {
      throw new UnauthorizedException('Login gagal');
    }

    const metadata = data.user.user_metadata ?? {};

    const profile = await this.syncProfile({
      authUserId: data.user.id,
      email: data.user.email,
      fullName:
        metadata.full_name ||
        metadata.name ||
        data.user.email.split('@')[0],
      phone: metadata.phone,
    });

    if (!profile.is_active) {
      throw new UnauthorizedException('Akun tidak aktif');
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

  async refreshToken(dto: RefreshTokenDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: dto.refresh_token,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data.user || !data.user.email || !data.session) {
      throw new UnauthorizedException('Refresh token gagal');
    }

    const profile = await this.syncProfile({
      authUserId: data.user.id,
      email: data.user.email,
      fullName:
        data.user.user_metadata?.full_name ||
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

  async me(user: AuthenticatedUser) {
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
}