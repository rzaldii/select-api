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
    ApiOperation,
    ApiParam,
    ApiTags,
  } from '@nestjs/swagger';
  import { CurrentUser } from '../common/decorators/current-user.decorator';
  import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
  import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { ReviewsService } from './reviews.service';
  
  @ApiTags('Reviews')
  @Controller()
  export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}
  
    @Post('bookings/:bookingId/items/:itemId/reviews')
    @ApiBearerAuth()
    @UseGuards(SupabaseAuthGuard)
    @ApiOperation({ summary: 'Customer memberi review barang setelah booking selesai' })
    @ApiParam({ name: 'bookingId', example: 1 })
    @ApiParam({ name: 'itemId', example: 2 })
    async createReview(
      @CurrentUser() user: AuthenticatedUser,
      @Param('bookingId', ParseIntPipe) bookingId: number,
      @Param('itemId', ParseIntPipe) itemId: number,
      @Body() dto: CreateReviewDto,
    ) {
      return {
        success: true,
        message: 'Review berhasil dibuat',
        data: await this.reviewsService.createReview(
          bookingId,
          itemId,
          user,
          dto,
        ),
      };
    }
  
    @Get('items/:itemId/reviews')
    @ApiOperation({ summary: 'Melihat review pada barang tertentu' })
    @ApiParam({ name: 'itemId', example: 1 })
    async findItemReviews(@Param('itemId', ParseIntPipe) itemId: number) {
      return {
        success: true,
        message: 'Review barang berhasil diambil',
        data: await this.reviewsService.findItemReviews(itemId),
      };
    }
  
    @Get('reviews/my')
    @ApiBearerAuth()
    @UseGuards(SupabaseAuthGuard)
    @ApiOperation({ summary: 'Customer melihat review yang pernah dibuat' })
    async findMyReviews(@CurrentUser() user: AuthenticatedUser) {
      return {
        success: true,
        message: 'Review saya berhasil diambil',
        data: await this.reviewsService.findMyReviews(user),
      };
    }
  }