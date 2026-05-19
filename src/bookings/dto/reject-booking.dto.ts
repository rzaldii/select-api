import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectBookingDto {
  @ApiPropertyOptional({
    example: 'Verifikasi identitas belum sesuai.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}