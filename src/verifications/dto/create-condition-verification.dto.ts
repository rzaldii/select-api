import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateConditionVerificationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  booking_id!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  item_id!: number;

  @ApiProperty({
    example: 'before_rent',
    enum: ['before_rent', 'after_rent'],
  })
  @IsIn(['before_rent', 'after_rent'])
  type!: 'before_rent' | 'after_rent';

  @ApiProperty({ example: 'condition/SEL-2026-0001/item-before.png' })
  @IsString()
  photo_path!: string;

  @ApiProperty({ example: -8.164846 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 113.715 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 'Jl. Kalimantan, Sumbersari, Jember' })
  @IsOptional()
  @IsString()
  address_text?: string;

  @ApiPropertyOptional({
    example: 'Kondisi barang baik, kelengkapan sesuai.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2026-06-10T08:30:00.000Z' })
  @IsDateString()
  taken_at!: string;
}