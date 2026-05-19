import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

const BLOCKING_BOOKING_STATUSES = [
  'pending_verification',
  'waiting_payment',
  'payment_pending',
  'paid',
  'approved',
  'ongoing',
] as const;

const SERVICE_FEE = 10000;

function toDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function countRentalDays(startDate: Date, endDate: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / oneDay) + 1;
}

function generateBookingCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SEL-${Date.now()}-${random}`;
}

function mapBooking(booking: any) {
  return {
    id: Number(booking.id),
    booking_code: booking.booking_code,
    customer: booking.customer
      ? {
          id: Number(booking.customer.id),
          full_name: booking.customer.full_name,
          email: booking.customer.email,
          phone: booking.customer.phone,
        }
      : null,
    rental_start_date: booking.rental_start_date,
    rental_end_date: booking.rental_end_date,
    total_days: booking.total_days,
    subtotal_amount: Number(booking.subtotal_amount),
    service_fee: Number(booking.service_fee),
    total_amount: Number(booking.total_amount),
    status: booking.status,
    customer_note: booking.customer_note,
    admin_note: booking.admin_note,
    approved_by: booking.approved_by ? Number(booking.approved_by) : null,
    approved_at: booking.approved_at,
    rejected_by: booking.rejected_by ? Number(booking.rejected_by) : null,
    rejected_at: booking.rejected_at,
    cancelled_at: booking.cancelled_at,
    expired_at: booking.expired_at,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    items:
      booking.booking_items?.map((bookingItem: any) => {
        const item = bookingItem.item;
        const primaryImage =
          item?.images?.find((image: any) => image.is_primary) ??
          item?.images?.[0];

        return {
          id: Number(bookingItem.id),
          item_id: Number(bookingItem.item_id),
          item_name_snapshot: bookingItem.item_name_snapshot,
          daily_price_snapshot: Number(bookingItem.daily_price_snapshot),
          rental_start_date: bookingItem.rental_start_date,
          rental_end_date: bookingItem.rental_end_date,
          line_total: bookingItem.line_total
            ? Number(bookingItem.line_total)
            : null,
          item: item
            ? {
                id: Number(item.id),
                name: item.name,
                slug: item.slug,
                brand: item.brand,
                model: item.model,
                serial_number: item.serial_number,
                status: item.status,
                primary_image: primaryImage
                  ? {
                      id: Number(primaryImage.id),
                      public_url: primaryImage.public_url,
                      storage_path: primaryImage.storage_path,
                    }
                  : null,
              }
            : null,
        };
      }) ?? [],
  };
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private validateDateRange(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Format tanggal tidak valid');
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Tanggal mulai sewa tidak boleh lebih besar dari tanggal selesai',
      );
    }
  }

  private async notifyAdmins(params: {
    type:
      | 'booking_created'
      | 'booking_approved'
      | 'booking_rejected'
      | 'payment_success'
      | 'payment_failed'
      | 'rental_reminder'
      | 'rental_completed'
      | 'system';
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    const admins = await this.prisma.profile.findMany({
      where: {
        role: 'admin',
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.createNotification({
          userId: Number(admin.id),
          type: params.type,
          title: params.title,
          body: params.body,
          data: params.data,
          sendPush: true,
        }),
      ),
    );
  }


  private async findUnavailableItemIds(
    itemIds: number[],
    startDate: Date,
    endDate: Date,
  ) {
    const blockingBookings = await this.prisma.bookingItem.findMany({
      where: {
        item_id: {
          in: itemIds.map((id) => BigInt(id)),
        },
        booking: {
          status: {
            in: [...BLOCKING_BOOKING_STATUSES],
          },
          rental_start_date: {
            lte: endDate,
          },
          rental_end_date: {
            gte: startDate,
          },
        },
      },
      select: {
        item_id: true,
      },
    });

    return [...new Set(blockingBookings.map((item) => Number(item.item_id)))];
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const startDate = toDateOnly(dto.rental_start_date);
    const endDate = toDateOnly(dto.rental_end_date);

    this.validateDateRange(startDate, endDate);

    const items = await this.prisma.item.findMany({
      where: {
        id: {
          in: dto.item_ids.map((id) => BigInt(id)),
        },
        is_active: true,
        status: {
          notIn: ['maintenance', 'inactive'],
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    const foundItemIds = items.map((item) => Number(item.id));
    const notFoundItemIds = dto.item_ids.filter(
      (id) => !foundItemIds.includes(id),
    );

    const unavailableItemIds = await this.findUnavailableItemIds(
      foundItemIds,
      startDate,
      endDate,
    );

    const result = dto.item_ids.map((itemId) => {
      const item = items.find((row) => Number(row.id) === itemId);

      if (!item) {
        return {
          item_id: itemId,
          item_name: null,
          is_available: false,
          reason: 'Barang tidak ditemukan, tidak aktif, atau maintenance',
        };
      }

      const isAvailable = !unavailableItemIds.includes(itemId);

      return {
        item_id: itemId,
        item_name: item.name,
        is_available: isAvailable,
        reason: isAvailable ? null : 'Barang bentrok dengan booking lain',
      };
    });

    return {
      is_available: result.every((item) => item.is_available),
      rental_start_date: dto.rental_start_date,
      rental_end_date: dto.rental_end_date,
      not_found_item_ids: notFoundItemIds,
      items: result,
    };
  }

  async createBooking(dto: CreateBookingDto, user: AuthenticatedUser) {
    const startDate = toDateOnly(dto.rental_start_date);
    const endDate = toDateOnly(dto.rental_end_date);

    this.validateDateRange(startDate, endDate);

    const rentalDays = countRentalDays(startDate, endDate);

    const items = await this.prisma.item.findMany({
      where: {
        id: {
          in: dto.item_ids.map((id) => BigInt(id)),
        },
        is_active: true,
        status: {
          notIn: ['maintenance', 'inactive'],
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    if (items.length !== dto.item_ids.length) {
      throw new BadRequestException(
        'Ada barang yang tidak ditemukan, tidak aktif, atau maintenance',
      );
    }

    const unavailableItemIds = await this.findUnavailableItemIds(
      dto.item_ids,
      startDate,
      endDate,
    );

    if (unavailableItemIds.length > 0) {
      throw new BadRequestException({
        message: 'Ada barang yang tidak tersedia pada rentang tanggal tersebut',
        unavailable_item_ids: unavailableItemIds,
      });
    }

    const subtotal = items.reduce((total, item) => {
      return total + Number(item.daily_price) * rentalDays;
    }, 0);

    const totalAmount = subtotal + SERVICE_FEE;

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const createdBooking = await tx.booking.create({
          data: {
            booking_code: generateBookingCode(),
            customer_id: BigInt(user.profile.id),
            rental_start_date: startDate,
            rental_end_date: endDate,
            subtotal_amount: subtotal,
            service_fee: SERVICE_FEE,
            total_amount: totalAmount,
            status: 'pending_verification',
            customer_note: dto.customer_note,
          },
        });

        await tx.bookingItem.createMany({
          data: items.map((item) => ({
            booking_id: createdBooking.id,
            item_id: item.id,
            item_name_snapshot: item.name,
            daily_price_snapshot: item.daily_price,
            rental_start_date: startDate,
            rental_end_date: endDate,
          })),
        });

        return tx.booking.findUnique({
          where: {
            id: createdBooking.id,
          },
          include: {
            customer: true,
            booking_items: {
              include: {
                item: {
                  include: {
                    images: true,
                  },
                },
              },
            },
          },
        });
      });

      const mappedBooking = mapBooking(booking);

      await this.notifyAdmins({
        type: 'booking_created',
        title: 'Booking Baru Masuk',
        body: `${user.profile.full_name} membuat booking ${mappedBooking.booking_code}.`,
        data: {
          booking_id: mappedBooking.id,
          booking_code: mappedBooking.booking_code,
          status: mappedBooking.status,
        },
      });

      return mappedBooking;


    } catch (error: any) {
      if (
        String(error?.message ?? '').includes(
          'Barang sedang tidak tersedia pada rentang tanggal tersebut',
        )
      ) {
        throw new BadRequestException(
          'Barang sedang tidak tersedia pada rentang tanggal tersebut',
        );
      }

      throw error;
    }
  }

  async findMyBookings(user: AuthenticatedUser, query: BookingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      customer_id: BigInt(user.profile.id),
    };

    if (query.status) {
      where.status = query.status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: true,
          booking_items: {
            include: {
              item: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map(mapBooking),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        customer: true,
        booking_items: {
          include: {
            item: {
              include: {
                images: true,
              },
            },
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
      throw new ForbiddenException('Tidak boleh mengakses booking ini');
    }

    return mapBooking(booking);
  }

  async cancelBooking(
    id: number,
    user: AuthenticatedUser,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (Number(booking.customer_id) !== user.profile.id) {
      throw new ForbiddenException('Tidak boleh membatalkan booking ini');
    }

    if (
      !['pending_verification', 'waiting_payment', 'payment_pending'].includes(
        booking.status,
      )
    ) {
      throw new BadRequestException(
        'Booking dengan status ini tidak bisa dibatalkan customer',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'cancelled',
        admin_note: dto.note,
        cancelled_at: new Date(),
      },
      include: {
        customer: true,
        booking_items: {
          include: {
            item: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });



    return mapBooking(updatedBooking);
  }

  async findAllForAdmin(query: BookingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: true,
          booking_items: {
            include: {
              item: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map(mapBooking),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async approveBooking(id: number, admin: AuthenticatedUser) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.status !== 'paid') {
      throw new BadRequestException(
        'Booking hanya bisa disetujui setelah pembayaran berhasil',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'approved',
        approved_by: BigInt(admin.profile.id),
        approved_at: new Date(),
      },
      include: {
        customer: true,
        booking_items: {
          include: {
            item: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    await this.notificationsService.createNotification({
      userId: Number(updatedBooking.customer_id),
      type: 'booking_approved',
      title: 'Booking Disetujui',
      body: `Booking ${updatedBooking.booking_code} telah disetujui. Silakan lanjutkan proses pengambilan barang.`,
      data: {
        booking_id: Number(updatedBooking.id),
        booking_code: updatedBooking.booking_code,
        status: updatedBooking.status,
      },
      sendPush: true,
    });

    return mapBooking(updatedBooking);
  }

  async rejectBooking(
    id: number,
    admin: AuthenticatedUser,
    dto: RejectBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
      throw new BadRequestException(
        'Booking dengan status ini tidak bisa ditolak',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'rejected',
        rejected_by: BigInt(admin.profile.id),
        rejected_at: new Date(),
        admin_note: dto.note,
      },
      include: {
        customer: true,
        booking_items: {
          include: {
            item: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    await this.notificationsService.createNotification({
      userId: Number(updatedBooking.customer_id),
      type: 'booking_rejected',
      title: 'Booking Ditolak',
      body: `Booking ${updatedBooking.booking_code} ditolak oleh admin.`,
      data: {
        booking_id: Number(updatedBooking.id),
        booking_code: updatedBooking.booking_code,
        status: updatedBooking.status,
        note: dto.note,
      },
      sendPush: true,
    });

    return mapBooking(updatedBooking);
  }
}