import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { BookingsService } from './bookings.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';

@ApiTags('Bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings/check-availability')
  @ApiOperation({ summary: 'Cek ketersediaan barang berdasarkan tanggal sewa' })
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return {
      success: true,
      message: 'Ketersediaan barang berhasil dicek',
      data: await this.bookingsService.checkAvailability(dto),
    };
  }

  @Post('bookings')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Customer membuat booking penyewaan' })
  async createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return {
      success: true,
      message: 'Booking berhasil dibuat',
      data: await this.bookingsService.createBooking(dto, user),
    };
  }

  @Get('bookings/my')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Customer melihat daftar booking miliknya' })
  async findMyBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BookingQueryDto,
  ) {
    const result = await this.bookingsService.findMyBookings(user, query);

    return {
      success: true,
      message: 'Data booking berhasil diambil',
      data: result.bookings,
      meta: result.meta,
    };
  }

  @Get('bookings/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Melihat detail booking' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Detail booking berhasil diambil',
      data: await this.bookingsService.findOne(id, user),
    };
  }

  @Patch('bookings/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Customer membatalkan booking' })
  @ApiParam({ name: 'id', example: 1 })
  async cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return {
      success: true,
      message: 'Booking berhasil dibatalkan',
      data: await this.bookingsService.cancelBooking(id, user, dto),
    };
  }

  @Get('admin/bookings')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin melihat semua data booking' })
  async findAllForAdmin(@Query() query: BookingQueryDto) {
    const result = await this.bookingsService.findAllForAdmin(query);

    return {
      success: true,
      message: 'Data booking admin berhasil diambil',
      data: result.bookings,
      meta: result.meta,
    };
  }

  @Patch('admin/bookings/:id/approve')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menyetujui booking' })
  @ApiParam({ name: 'id', example: 1 })
  async approveBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Booking berhasil disetujui',
      data: await this.bookingsService.approveBooking(id, user),
    };
  }

  @Patch('admin/bookings/:id/reject')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menolak booking' })
  @ApiParam({ name: 'id', example: 1 })
  async rejectBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectBookingDto,
  ) {
    return {
      success: true,
      message: 'Booking berhasil ditolak',
      data: await this.bookingsService.rejectBooking(id, user, dto),
    };
  }
}