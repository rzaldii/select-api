import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ItemQueryDto {
  @ApiPropertyOptional({ example: 'sony' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @ApiPropertyOptional({
    example: 'available',
    enum: ['available', 'rented', 'maintenance', 'inactive'],
  })
  @IsOptional()
  @IsIn(['available', 'rented', 'maintenance', 'inactive'])
  status?: 'available' | 'rented' | 'maintenance' | 'inactive';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}