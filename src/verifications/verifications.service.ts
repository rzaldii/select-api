import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateConditionVerificationDto } from './dto/create-condition-verification.dto';
import { CreateIdentityVerificationDto } from './dto/create-identity-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { NotificationsService } from '../notifications/notifications.service';

function mapIdentityVerification(data: any) {
  return {
    id: Number(data.id),
    booking_id: Number(data.booking_id),
    user_id: Number(data.user_id),
    document_type: data.document_type,
    ktp_name: data.ktp_name,
    ktp_number_masked: data.ktp_number_masked,
    photo_bucket: data.photo_bucket,
    photo_path: data.photo_path,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    address_text: data.address_text,
    taken_at: data.taken_at,
    status: data.status,
    reviewed_by: data.reviewed_by ? Number(data.reviewed_by) : null,
    reviewed_at: data.reviewed_at,
    rejection_reason: data.rejection_reason,
    created_at: data.created_at,
    updated_at: data.updated_at,
    booking: data.booking
      ? {
          id: Number(data.booking.id),
          booking_code: data.booking.booking_code,
          status: data.booking.status,
          rental_start_date: data.booking.rental_start_date,
          rental_end_date: data.booking.rental_end_date,
        }
      : null,
    user: data.user
      ? {
          id: Number(data.user.id),
          full_name: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone,
        }
      : null,
  };
}

function mapConditionVerification(data: any) {
  return {
    id: Number(data.id),
    booking_id: Number(data.booking_id),
    item_id: Number(data.item_id),
    submitted_by: Number(data.submitted_by),
    type: data.type,
    photo_bucket: data.photo_bucket,
    photo_path: data.photo_path,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    address_text: data.address_text,
    note: data.note,
    taken_at: data.taken_at,
    status: data.status,
    reviewed_by: data.reviewed_by ? Number(data.reviewed_by) : null,
    reviewed_at: data.reviewed_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    booking: data.booking
      ? {
          id: Number(data.booking.id),
          booking_code: data.booking.booking_code,
          status: data.booking.status,
        }
      : null,
    item: data.item
      ? {
          id: Number(data.item.id),
          name: data.item.name,
          serial_number: data.item.serial_number,
          status: data.item.status,
        }
      : null,
    submitter: data.submitter
      ? {
          id: Number(data.submitter.id),
          full_name: data.submitter.full_name,
          email: data.submitter.email,
        }
      : null,
  };
}

@Injectable()
export class VerificationsService {
  private async notifyAdmins(params: {
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
          type: 'system',
          title: params.title,
          body: params.body,
          data: params.data,
          sendPush: true,
        }),
      ),
    );
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitIdentityVerification(
    dto: CreateIdentityVerificationDto,
    user: AuthenticatedUser,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(dto.booking_id),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (Number(booking.customer_id) !== user.profile.id) {
      throw new ForbiddenException('Tidak boleh mengirim verifikasi booking ini');
    }

    if (['rejected', 'cancelled', 'completed', 'expired'].includes(booking.status)) {
      throw new BadRequestException(
        'Verifikasi identitas tidak bisa dikirim untuk status booking ini',
      );
    }

    const verification = await this.prisma.identityVerification.upsert({
      where: {
        booking_id: BigInt(dto.booking_id),
      },
      update: {
        document_type: dto.document_type ?? 'ktp',
        ktp_name: dto.ktp_name,
        ktp_number_masked: dto.ktp_number_masked,
        photo_path: dto.photo_path,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address_text: dto.address_text,
        taken_at: new Date(dto.taken_at),
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
      },
      create: {
        booking_id: BigInt(dto.booking_id),
        user_id: BigInt(user.profile.id),
        document_type: dto.document_type ?? 'ktp',
        ktp_name: dto.ktp_name,
        ktp_number_masked: dto.ktp_number_masked,
        photo_path: dto.photo_path,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address_text: dto.address_text,
        taken_at: new Date(dto.taken_at),
        status: 'pending',
      },
      include: {
        booking: true,
        user: true,
      },
    });

    const mappedVerification = mapIdentityVerification(verification);

    await this.notifyAdmins({
      title: 'Verifikasi Identitas Baru',
      body: `${user.profile.full_name} mengirim verifikasi identitas untuk booking ${mappedVerification.booking?.booking_code}.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        type: 'identity_verification',
      },
    });

    return mappedVerification;
  }

  async submitConditionVerification(
    dto: CreateConditionVerificationDto,
    user: AuthenticatedUser,
    
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: BigInt(dto.booking_id),
      },
      include: {
        booking_items: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (Number(booking.customer_id) !== user.profile.id) {
      throw new ForbiddenException('Tidak boleh mengirim verifikasi booking ini');
    }

    const itemIsPartOfBooking = booking.booking_items.some(
      (bookingItem) => Number(bookingItem.item_id) === dto.item_id,
    );

    if (!itemIsPartOfBooking) {
      throw new BadRequestException('Barang tidak termasuk dalam booking ini');
    }

    if (dto.type === 'before_rent') {
      if (!['approved', 'ongoing', 'paid'].includes(booking.status)) {
        throw new BadRequestException(
          'Foto kondisi sebelum sewa hanya bisa dikirim setelah booking disetujui',
        );
      }
    }

    if (dto.type === 'after_rent') {
      if (!['ongoing', 'completed'].includes(booking.status)) {
        throw new BadRequestException(
          'Foto kondisi setelah sewa hanya bisa dikirim saat booking berjalan atau selesai',
        );
      }
    }

    const verification = await this.prisma.conditionVerification.upsert({
      where: {
        booking_id_item_id_type: {
          booking_id: BigInt(dto.booking_id),
          item_id: BigInt(dto.item_id),
          type: dto.type,
        },
      },
      update: {
        photo_path: dto.photo_path,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address_text: dto.address_text,
        note: dto.note,
        taken_at: new Date(dto.taken_at),
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
      },
      create: {
        booking_id: BigInt(dto.booking_id),
        item_id: BigInt(dto.item_id),
        submitted_by: BigInt(user.profile.id),
        type: dto.type,
        photo_path: dto.photo_path,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address_text: dto.address_text,
        note: dto.note,
        taken_at: new Date(dto.taken_at),
        status: 'pending',
      },
      include: {
        booking: true,
        item: true,
        submitter: true,
      },
    });

    const mappedVerification = mapConditionVerification(verification);

    await this.notifyAdmins({
      title: 'Verifikasi Kondisi Barang Baru',
      body: `${user.profile.full_name} mengirim foto kondisi barang untuk booking ${mappedVerification.booking?.booking_code}.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        item_id: mappedVerification.item_id,
        condition_type: mappedVerification.type,
        type: 'condition_verification',
      },
    });

    return mappedVerification;
  }

  async findIdentityVerificationsForAdmin() {
    const data = await this.prisma.identityVerification.findMany({
      include: {
        booking: true,
        user: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return data.map(mapIdentityVerification);
  }

  async findConditionVerificationsForAdmin() {
    const data = await this.prisma.conditionVerification.findMany({
      include: {
        booking: true,
        item: true,
        submitter: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return data.map(mapConditionVerification);
  }

  async approveIdentityVerification(id: number, admin: AuthenticatedUser) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!verification) {
      throw new NotFoundException('Verifikasi identitas tidak ditemukan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const identity = await tx.identityVerification.update({
        where: {
          id: BigInt(id),
        },
        data: {
          status: 'approved',
          reviewed_by: BigInt(admin.profile.id),
          reviewed_at: new Date(),
          rejection_reason: null,
        },
        include: {
          booking: true,
          user: true,
        },
      });

      await tx.booking.update({
        where: {
          id: identity.booking_id,
        },
        data: {
          status: 'waiting_payment',
        },
      });

      return identity;
    });

    const mappedVerification = mapIdentityVerification(updated);

    await this.notificationsService.createNotification({
      userId: mappedVerification.user_id,
      type: 'system',
      title: 'Verifikasi Identitas Disetujui',
      body: `Verifikasi identitas untuk booking ${mappedVerification.booking?.booking_code} telah disetujui. Silakan lanjutkan pembayaran.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        next_status: 'waiting_payment',
      },
      sendPush: true,
    });

    return mappedVerification;
  }

  async rejectIdentityVerification(
    id: number,
    admin: AuthenticatedUser,
    dto: RejectVerificationDto,
  ) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!verification) {
      throw new NotFoundException('Verifikasi identitas tidak ditemukan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const identity = await tx.identityVerification.update({
        where: {
          id: BigInt(id),
        },
        data: {
          status: 'rejected',
          reviewed_by: BigInt(admin.profile.id),
          reviewed_at: new Date(),
          rejection_reason: dto.reason,
        },
        include: {
          booking: true,
          user: true,
        },
      });

      await tx.booking.update({
        where: {
          id: identity.booking_id,
        },
        data: {
          status: 'rejected',
          admin_note: dto.reason,
          rejected_by: BigInt(admin.profile.id),
          rejected_at: new Date(),
        },
      });

      return identity;
    });

    const mappedVerification = mapIdentityVerification(updated);

    await this.notificationsService.createNotification({
      userId: mappedVerification.user_id,
      type: 'system',
      title: 'Verifikasi Identitas Ditolak',
      body: `Verifikasi identitas untuk booking ${mappedVerification.booking?.booking_code} ditolak.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        reason: dto.reason,
      },
      sendPush: true,
    });

    return mappedVerification;
  }

  async approveConditionVerification(id: number, admin: AuthenticatedUser) {
    const verification = await this.prisma.conditionVerification.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!verification) {
      throw new NotFoundException('Verifikasi kondisi barang tidak ditemukan');
    }

    const updated = await this.prisma.conditionVerification.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'approved',
        reviewed_by: BigInt(admin.profile.id),
        reviewed_at: new Date(),
      },
      include: {
        booking: true,
        item: true,
        submitter: true,
      },
    });

    const mappedVerification = mapConditionVerification(updated);

    await this.notificationsService.createNotification({
      userId: mappedVerification.submitted_by,
      type: 'system',
      title: 'Verifikasi Kondisi Barang Disetujui',
      body: `Verifikasi kondisi barang ${mappedVerification.item?.name} telah disetujui.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        item_id: mappedVerification.item_id,
        condition_type: mappedVerification.type,
      },
      sendPush: true,
    });

    return mappedVerification;
  }

  async rejectConditionVerification(
    id: number,
    admin: AuthenticatedUser,
    dto: RejectVerificationDto,
  ) {
    const verification = await this.prisma.conditionVerification.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!verification) {
      throw new NotFoundException('Verifikasi kondisi barang tidak ditemukan');
    }

    const updated = await this.prisma.conditionVerification.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: 'rejected',
        reviewed_by: BigInt(admin.profile.id),
        reviewed_at: new Date(),
        note: dto.reason,
      },
      include: {
        booking: true,
        item: true,
        submitter: true,
      },
    });

    const mappedVerification = mapConditionVerification(updated);

    await this.notificationsService.createNotification({
      userId: mappedVerification.submitted_by,
      type: 'system',
      title: 'Verifikasi Kondisi Barang Ditolak',
      body: `Verifikasi kondisi barang ${mappedVerification.item?.name} ditolak.`,
      data: {
        verification_id: mappedVerification.id,
        booking_id: mappedVerification.booking_id,
        booking_code: mappedVerification.booking?.booking_code,
        item_id: mappedVerification.item_id,
        condition_type: mappedVerification.type,
        reason: dto.reason,
      },
      sendPush: true,
    });

    return mappedVerification;
  }
}