import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateIdentityVerificationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  booking_id!: number;

  @ApiPropertyOptional({ example: 'ktp' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  document_type?: string;

  @ApiPropertyOptional({ example: 'Iqbal Rizaldi' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ktp_name?: string;

  @ApiPropertyOptional({ example: '3509********0002' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ktp_number_masked?: string;

  @ApiProperty({ example: 'ktp/SEL-2026-0001/ktp-iqbal.png' })
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

  @ApiProperty({ example: '2026-06-01T10:20:00.000Z' })
  @IsDateString()
  taken_at!: string;
}