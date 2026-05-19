import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class BookingQueryDto {
  @ApiPropertyOptional({
    example: 'pending_verification',
    enum: [
      'pending_verification',
      'waiting_payment',
      'payment_pending',
      'paid',
      'approved',
      'rejected',
      'ongoing',
      'completed',
      'cancelled',
      'expired',
    ],
  })
  @IsOptional()
  @IsIn([
    'pending_verification',
    'waiting_payment',
    'payment_pending',
    'paid',
    'approved',
    'rejected',
    'ongoing',
    'completed',
    'cancelled',
    'expired',
  ])
  status?:
    | 'pending_verification'
    | 'waiting_payment'
    | 'payment_pending'
    | 'paid'
    | 'approved'
    | 'rejected'
    | 'ongoing'
    | 'completed'
    | 'cancelled'
    | 'expired';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}