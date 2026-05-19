import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapProfile } from '../common/mappers/profile.mapper';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(profileId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: BigInt(profileId),
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil tidak ditemukan');
    }

    return mapProfile(profile);
  }

  async updateMe(profileId: number, dto: UpdateMeDto) {
    const profile = await this.prisma.profile.update({
      where: {
        id: BigInt(profileId),
      },
      data: {
        full_name: dto.full_name,
        phone: dto.phone,
        avatar_path: dto.avatar_path,
      },
    });

    return mapProfile(profile);
  }

  async findAllUsers() {
    const users = await this.prisma.profile.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    return users.map(mapProfile);
  }

  async updateUserRole(id: number, dto: UpdateUserRoleDto) {
    const profile = await this.prisma.profile.update({
      where: {
        id: BigInt(id),
      },
      data: {
        role: dto.role,
      },
    });

    return mapProfile(profile);
  }
}