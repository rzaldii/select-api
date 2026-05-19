import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRentalStatusDto {
  @ApiPropertyOptional({
    example: 'Barang sudah diambil customer dalam kondisi baik.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}