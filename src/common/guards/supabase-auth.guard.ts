import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { mapProfile } from '../mappers/profile.mapper';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      throw new UnauthorizedException('Token tidak valid');
    }

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token Supabase tidak valid');
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
      } else if (existingEmailProfile?.auth_user_id) {
        throw new UnauthorizedException('Email sudah terhubung dengan akun lain');
      }
    }

    if (!profile) {
      const metadata = authUser.user_metadata ?? {};

      const fallbackName =
        metadata.full_name ||
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
      throw new ForbiddenException('Akun tidak aktif');
    }

    request.user = {
      authUserId: authUser.id,
      email,
      profile: mapProfile(profile),
    };

    return true;
  }
}