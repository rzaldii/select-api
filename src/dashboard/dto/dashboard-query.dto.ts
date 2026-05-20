import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'Jumlah data top item yang ditampilkan',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  top_item_limit?: number = 3;

  @ApiPropertyOptional({
    example: 5,
    description: 'Jumlah aktivitas booking terbaru yang ditampilkan',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recent_booking_limit?: number = 5;
}