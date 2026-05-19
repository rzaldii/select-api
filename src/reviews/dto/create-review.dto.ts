import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    example: 'Barang sangat baik, proses penyewaan jelas, dan admin responsif.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: 'review-media',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  media_bucket?: string;

  @ApiPropertyOptional({
    example: 'reviews/SEL-2026-0005/review-item.png',
  })
  @IsOptional()
  @IsString()
  media_path?: string;
}