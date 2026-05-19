import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    example: [1],
    description: 'ID barang yang akan disewa',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  item_ids!: number[];

  @ApiProperty({
    example: '2026-06-10',
  })
  @IsDateString()
  rental_start_date!: string;

  @ApiProperty({
    example: '2026-06-12',
  })
  @IsDateString()
  rental_end_date!: string;

  @ApiPropertyOptional({
    example: 'Digunakan untuk dokumentasi acara kampus.',
  })
  @IsOptional()
  @IsString()
  customer_note?: string;
}