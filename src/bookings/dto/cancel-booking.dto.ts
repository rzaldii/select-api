import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelBookingDto {
  @ApiPropertyOptional({
    example: 'Customer membatalkan karena jadwal berubah.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}