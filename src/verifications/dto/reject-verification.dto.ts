import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectVerificationDto {
  @ApiPropertyOptional({
    example: 'Foto kurang jelas atau data tidak sesuai.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}