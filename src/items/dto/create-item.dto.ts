import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  category_id!: number;

  @ApiProperty({ example: 'Canon EOS R50' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'canon-eos-r50' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({ example: 'Canon' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'EOS R50' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({ example: 'CANON-R50-001' })
  @IsString()
  @MaxLength(100)
  serial_number!: string;

  @ApiPropertyOptional({
    example: 'Kamera mirrorless ringan untuk dokumentasi dan konten.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 300000 })
  @IsNumber()
  @Min(0)
  daily_price!: number;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  replacement_value?: number;

  @ApiPropertyOptional({
    example: 'available',
    enum: ['available', 'rented', 'maintenance', 'inactive'],
  })
  @IsOptional()
  @IsIn(['available', 'rented', 'maintenance', 'inactive'])
  status?: 'available' | 'rented' | 'maintenance' | 'inactive';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: {
      sensor: 'APS-C',
      resolution: '24MP',
      video: '4K 30fps',
    },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;
}