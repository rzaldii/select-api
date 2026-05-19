import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
  import { CreateReviewDto } from './dto/create-review.dto';
  
  function mapReview(review: any) {
    return {
      id: Number(review.id),
      booking_id: Number(review.booking_id),
      item_id: Number(review.item_id),
      user_id: Number(review.user_id),
      rating: review.rating,
      comment: review.comment,
      media_bucket: review.media_bucket,
      media_path: review.media_path,
      is_visible: review.is_visible,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user: review.user
        ? {
            id: Number(review.user.id),
            full_name: review.user.full_name,
            avatar_path: review.user.avatar_path,
          }
        : null,
      item: review.item
        ? {
            id: Number(review.item.id),
            name: review.item.name,
            slug: review.item.slug,
          }
        : null,
      booking: review.booking
        ? {
            id: Number(review.booking.id),
            booking_code: review.booking.booking_code,
            status: review.booking.status,
          }
        : null,
    };
  }
  
  @Injectable()
  export class ReviewsService {
    constructor(private readonly prisma: PrismaService) {}
  
    async createReview(
      bookingId: number,
      itemId: number,
      user: AuthenticatedUser,
      dto: CreateReviewDto,
    ) {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: BigInt(bookingId),
        },
        include: {
          booking_items: true,
        },
      });
  
      if (!booking) {
        throw new NotFoundException('Booking tidak ditemukan');
      }
  
      if (Number(booking.customer_id) !== user.profile.id) {
        throw new ForbiddenException('Tidak boleh memberi review untuk booking ini');
      }
  
      if (booking.status !== 'completed') {
        throw new BadRequestException(
          'Review hanya bisa diberikan setelah booking selesai',
        );
      }
  
      const itemIsInBooking = booking.booking_items.some(
        (bookingItem) => Number(bookingItem.item_id) === itemId,
      );
  
      if (!itemIsInBooking) {
        throw new BadRequestException('Barang tidak termasuk dalam booking ini');
      }
  
      const existingReview = await this.prisma.review.findUnique({
        where: {
          booking_id_item_id_user_id: {
            booking_id: BigInt(bookingId),
            item_id: BigInt(itemId),
            user_id: BigInt(user.profile.id),
          },
        },
      });
  
      if (existingReview) {
        throw new BadRequestException(
          'Review untuk barang pada booking ini sudah dibuat',
        );
      }
  
      const review = await this.prisma.review.create({
        data: {
          booking_id: BigInt(bookingId),
          item_id: BigInt(itemId),
          user_id: BigInt(user.profile.id),
          rating: dto.rating,
          comment: dto.comment,
          media_bucket: dto.media_bucket,
          media_path: dto.media_path,
          is_visible: true,
        },
        include: {
          user: true,
          item: true,
          booking: true,
        },
      });
  
      return mapReview(review);
    }
  
    async findItemReviews(itemId: number) {
      const item = await this.prisma.item.findFirst({
        where: {
          id: BigInt(itemId),
          is_active: true,
        },
      });
  
      if (!item) {
        throw new NotFoundException('Barang tidak ditemukan');
      }
  
      const reviews = await this.prisma.review.findMany({
        where: {
          item_id: BigInt(itemId),
          is_visible: true,
        },
        include: {
          user: true,
          item: true,
          booking: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
  
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((total, review) => total + review.rating, 0) /
            reviews.length
          : 0;
  
      return {
        item_id: itemId,
        average_rating: Number(averageRating.toFixed(2)),
        total_reviews: reviews.length,
        reviews: reviews.map(mapReview),
      };
    }
  
    async findMyReviews(user: AuthenticatedUser) {
      const reviews = await this.prisma.review.findMany({
        where: {
          user_id: BigInt(user.profile.id),
        },
        include: {
          user: true,
          item: true,
          booking: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
  
      return reviews.map(mapReview);
    }
  }