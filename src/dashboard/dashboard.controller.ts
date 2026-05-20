import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Admin melihat seluruh ringkasan dashboard' })
  async getDashboard(@Query() query: DashboardQueryDto) {
    return {
      success: true,
      message: 'Dashboard berhasil diambil',
      data: await this.dashboardService.getDashboard(query),
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Admin melihat ringkasan statistik dashboard' })
  async getSummary() {
    return {
      success: true,
      message: 'Ringkasan dashboard berhasil diambil',
      data: await this.dashboardService.getSummary(),
    };
  }

  @Get('top-items')
  @ApiOperation({ summary: 'Admin melihat barang paling sering disewa' })
  async getTopItems(@Query() query: DashboardQueryDto) {
    return {
      success: true,
      message: 'Top barang berhasil diambil',
      data: await this.dashboardService.getTopItems(
        query.top_item_limit ?? 3,
      ),
    };
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Admin melihat aktivitas booking terbaru' })
  async getRecentBookings(@Query() query: DashboardQueryDto) {
    return {
      success: true,
      message: 'Booking terbaru berhasil diambil',
      data: await this.dashboardService.getRecentBookings(
        query.recent_booking_limit ?? 5,
      ),
    };
  }

  @Get('booking-status-distribution')
  @ApiOperation({ summary: 'Admin melihat distribusi status booking' })
  async getBookingStatusDistribution() {
    return {
      success: true,
      message: 'Distribusi status booking berhasil diambil',
      data: await this.dashboardService.getBookingStatusDistribution(),
    };
  }
}