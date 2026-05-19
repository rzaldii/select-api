import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiTags,
  } from '@nestjs/swagger';
  import { CurrentUser } from '../common/decorators/current-user.decorator';
  import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
  import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
  import { PaymentsService } from './payments.service';
  
  @ApiTags('Payments')
  @Controller()
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    @Post('payments/create/:bookingId')
    @ApiBearerAuth()
    @UseGuards(SupabaseAuthGuard)
    @ApiOperation({ summary: 'Membuat transaksi pembayaran Midtrans Snap' })
    @ApiParam({ name: 'bookingId', example: 1 })
    async createPayment(
      @CurrentUser() user: AuthenticatedUser,
      @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
      return {
        success: true,
        message: 'Transaksi pembayaran berhasil dibuat',
        data: await this.paymentsService.createPayment(bookingId, user),
      };
    }
  
    @Get('payments/booking/:bookingId')
    @ApiBearerAuth()
    @UseGuards(SupabaseAuthGuard)
    @ApiOperation({ summary: 'Melihat status pembayaran berdasarkan booking' })
    @ApiParam({ name: 'bookingId', example: 1 })
    async findPaymentByBooking(
      @CurrentUser() user: AuthenticatedUser,
      @Param('bookingId', ParseIntPipe) bookingId: number,
    ) {
      return {
        success: true,
        message: 'Status pembayaran berhasil diambil',
        data: await this.paymentsService.findPaymentByBooking(bookingId, user),
      };
    }
  
    @Post('payments/webhook/midtrans')
    @ApiOperation({ summary: 'Webhook Midtrans untuk update status pembayaran' })
    @ApiBody({
      schema: {
        example: {
          transaction_status: 'settlement',
          order_id: 'SEL-2026-0001',
          status_code: '200',
          gross_amount: '1360000.00',
          signature_key: 'signature_key_from_midtrans',
          payment_type: 'bank_transfer',
          transaction_id: 'midtrans-transaction-id',
          fraud_status: 'accept',
        },
      },
    })
    async handleMidtransWebhook(@Body() payload: Record<string, any>) {
      return {
        success: true,
        message: 'Webhook Midtrans berhasil diproses',
        data: await this.paymentsService.handleMidtransWebhook(payload),
      };
    }
  }