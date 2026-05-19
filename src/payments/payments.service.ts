import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { createHash } from 'crypto';
  import { ConfigService } from '@nestjs/config';
  import { PrismaService } from '../prisma/prisma.service';
  import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
  
  const SUCCESS_PAYMENT_STATUSES = ['settlement', 'capture'];
  const FAILED_PAYMENT_STATUSES = ['deny', 'cancel', 'failure'];
  const RETRYABLE_PAYMENT_STATUSES = ['deny', 'cancel', 'expire', 'failure'];
  
  function mapPayment(payment: any) {
    return {
      id: Number(payment.id),
      booking_id: Number(payment.booking_id),
      provider: payment.provider,
      external_order_id: payment.external_order_id,
      transaction_id: payment.transaction_id,
      snap_token: payment.snap_token,
      redirect_url: payment.redirect_url,
      gross_amount: Number(payment.gross_amount),
      payment_type: payment.payment_type,
      status: payment.status,
      fraud_status: payment.fraud_status,
      paid_at: payment.paid_at,
      expired_at: payment.expired_at,
      raw_response: payment.raw_response,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      booking: payment.booking
        ? {
            id: Number(payment.booking.id),
            booking_code: payment.booking.booking_code,
            status: payment.booking.status,
            total_amount: Number(payment.booking.total_amount),
          }
        : null,
    };
  }
  
  @Injectable()
  export class PaymentsService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly configService: ConfigService,
    ) {}
  
    private getMidtransServerKey() {
      const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
  
      if (!serverKey) {
        throw new Error('MIDTRANS_SERVER_KEY belum tersedia di .env');
      }
  
      return serverKey;
    }
  
    private getSnapUrl() {
      const isProduction =
        this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
  
      return isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }
  
    private getBasicAuthHeader() {
      const serverKey = this.getMidtransServerKey();
      const encoded = Buffer.from(`${serverKey}:`).toString('base64');
  
      return `Basic ${encoded}`;
    }
  
    private toPaymentStatus(status: string | undefined) {
      const allowed = [
        'pending',
        'settlement',
        'capture',
        'deny',
        'cancel',
        'expire',
        'refund',
        'failure',
      ];
  
      if (status && allowed.includes(status)) {
        return status as any;
      }
  
      return 'pending';
    }
  
    private verifyMidtransSignature(payload: Record<string, any>) {
      const serverKey = this.getMidtransServerKey();
  
      const orderId = String(payload.order_id ?? '');
      const statusCode = String(payload.status_code ?? '');
      const grossAmount = String(payload.gross_amount ?? '');
      const signatureKey = String(payload.signature_key ?? '');
  
      if (!orderId || !statusCode || !grossAmount || !signatureKey) {
        throw new BadRequestException('Payload Midtrans tidak lengkap');
      }
  
      const expectedSignature = createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex');
  
      if (signatureKey !== expectedSignature) {
        throw new ForbiddenException('Signature Midtrans tidak valid');
      }
    }
  
    async createPayment(bookingId: number, user: AuthenticatedUser) {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: BigInt(bookingId),
        },
        include: {
          customer: true,
          booking_items: true,
          payment: true,
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Booking tidak ditemukan');
      }
  
      if (Number(booking.customer_id) !== user.profile.id) {
        throw new ForbiddenException('Tidak boleh membayar booking ini');
      }
  
      if (!['waiting_payment', 'payment_pending'].includes(booking.status)) {
        throw new BadRequestException(
          'Booking belum berada pada status menunggu pembayaran',
        );
      }
  
      if (
        booking.payment &&
        booking.payment.status === 'pending' &&
        booking.payment.snap_token
      ) {
        return mapPayment(booking.payment);
      }
  
      if (
        booking.payment &&
        SUCCESS_PAYMENT_STATUSES.includes(booking.payment.status)
      ) {
        return mapPayment(booking.payment);
      }
  
      const grossAmount = Math.round(Number(booking.total_amount));
  
      if (grossAmount <= 0) {
        throw new BadRequestException('Total pembayaran tidak valid');
      }
  
      const shouldCreateNewOrderId =
        booking.payment &&
        RETRYABLE_PAYMENT_STATUSES.includes(booking.payment.status);
  
      const externalOrderId = shouldCreateNewOrderId
        ? `${booking.booking_code}-${Date.now()}`
        : booking.booking_code;
  
      const itemDetails = booking.booking_items.map((item) => ({
        id: String(item.item_id),
        price: Math.round(Number(item.daily_price_snapshot)),
        quantity: Number(booking.total_days ?? 1),
        name: item.item_name_snapshot.substring(0, 50),
      }));
  
      if (Number(booking.service_fee) > 0) {
        itemDetails.push({
          id: 'SERVICE-FEE',
          price: Math.round(Number(booking.service_fee)),
          quantity: 1,
          name: 'Biaya layanan SELECT',
        });
      }
  
      const payload = {
        transaction_details: {
          order_id: externalOrderId,
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: booking.customer.full_name,
          email: booking.customer.email,
          phone: booking.customer.phone ?? undefined,
        },
        item_details: itemDetails,
      };
  
      const response = await fetch(this.getSnapUrl(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: this.getBasicAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
  
      const responseBody = await response.json();
  
      if (!response.ok) {
        throw new BadRequestException({
          message: 'Gagal membuat transaksi Midtrans',
          midtrans_response: responseBody,
        });
      }
  
      const payment = await this.prisma.$transaction(async (tx) => {
        const savedPayment = booking.payment
          ? await tx.payment.update({
              where: {
                id: booking.payment.id,
              },
              data: {
                external_order_id: externalOrderId,
                snap_token: responseBody.token,
                redirect_url: responseBody.redirect_url,
                gross_amount: grossAmount,
                status: 'pending',
                raw_response: responseBody,
                expired_at: null,
              },
              include: {
                booking: true,
              },
            })
          : await tx.payment.create({
              data: {
                booking_id: booking.id,
                provider: 'midtrans',
                external_order_id: externalOrderId,
                snap_token: responseBody.token,
                redirect_url: responseBody.redirect_url,
                gross_amount: grossAmount,
                status: 'pending',
                raw_response: responseBody,
              },
              include: {
                booking: true,
              },
            });
  
        await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            status: 'payment_pending',
          },
        });
  
        return savedPayment;
      });
  
      return mapPayment(payment);
    }
  
    async findPaymentByBooking(bookingId: number, user: AuthenticatedUser) {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: BigInt(bookingId),
        },
        include: {
          payment: {
            include: {
              booking: true,
            },
          },
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Booking tidak ditemukan');
      }
  
      const isOwner = Number(booking.customer_id) === user.profile.id;
      const isAdmin = user.profile.role === 'admin';
  
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Tidak boleh mengakses pembayaran ini');
      }
  
      if (!booking.payment) {
        throw new NotFoundException('Pembayaran belum dibuat');
      }
  
      return mapPayment(booking.payment);
    }
  
    async handleMidtransWebhook(payload: Record<string, any>) {
      this.verifyMidtransSignature(payload);
  
      const externalOrderId = String(payload.order_id);
      const transactionStatus = String(payload.transaction_status ?? 'pending');
      const paymentStatus = this.toPaymentStatus(transactionStatus);
      const fraudStatus = payload.fraud_status
        ? String(payload.fraud_status)
        : null;
  
      const payment = await this.prisma.payment.findUnique({
        where: {
          external_order_id: externalOrderId,
        },
        include: {
          booking: true,
        },
      });
  
      if (!payment) {
        return {
          ignored: true,
          message: 'Payment tidak ditemukan, webhook diabaikan',
        };
      }
  
      const isSuccess =
        SUCCESS_PAYMENT_STATUSES.includes(paymentStatus) &&
        fraudStatus !== 'deny';
  
      const isExpired = paymentStatus === 'expire';
      const isFailed = FAILED_PAYMENT_STATUSES.includes(paymentStatus);
  
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            transaction_id: payload.transaction_id
              ? String(payload.transaction_id)
              : payment.transaction_id,
            payment_type: payload.payment_type
              ? String(payload.payment_type)
              : payment.payment_type,
            status: paymentStatus,
            fraud_status: fraudStatus,
            raw_response: payload,
            paid_at: isSuccess ? new Date() : payment.paid_at,
            expired_at: isExpired ? new Date() : payment.expired_at,
          },
          include: {
            booking: true,
          },
        });
  
        await tx.paymentEvent.create({
          data: {
            payment_id: payment.id,
            event_type: transactionStatus,
            status: paymentStatus,
            payload,
          },
        });
  
        if (isSuccess) {
          await tx.booking.update({
            where: {
              id: payment.booking_id,
            },
            data: {
              status: 'paid',
            },
          });
        } else if (isExpired) {
          await tx.booking.update({
            where: {
              id: payment.booking_id,
            },
            data: {
              status: 'expired',
              expired_at: new Date(),
            },
          });
        } else if (isFailed) {
          await tx.booking.update({
            where: {
              id: payment.booking_id,
            },
            data: {
              status: 'waiting_payment',
            },
          });
        }
  
        return updatedPayment;
      });
  
      return mapPayment(result);
    }
  }