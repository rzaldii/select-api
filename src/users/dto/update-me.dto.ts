import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'Iqbal Rizaldi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  full_name?: string;

  @ApiPropertyOptional({
    example: '081234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: 'profile-photos/iqbal.png',
  })
  @IsOptional()
  @IsString()
  avatar_path?: string;
}