import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const totalUsers = await this.prisma.profile.count();
    const totalItems = await this.prisma.item.count();
    const totalBookings = await this.prisma.booking.count();

    return {
      status: 'ok',
      database: 'connected',
      totalUsers,
      totalItems,
      totalBookings,
    };
  }
}