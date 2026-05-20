import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateSignedReadUrlDto {
  @ApiProperty({
    example: 'identity-documents',
    enum: [
      'item-images',
      'profile-photos',
      'identity-documents',
      'condition-photos',
      'review-media',
    ],
  })
  @IsIn([
    'item-images',
    'profile-photos',
    'identity-documents',
    'condition-photos',
    'review-media',
  ])
  bucket!:
    | 'item-images'
    | 'profile-photos'
    | 'identity-documents'
    | 'condition-photos'
    | 'review-media';

  @ApiProperty({
    example: 'ktp/SEL-2026-0005/ktp-iqbal.png',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9/_\-.]+$/, {
    message:
      'path hanya boleh berisi huruf, angka, slash, underscore, strip, dan titik',
  })
  path!: string;

  @ApiPropertyOptional({
    example: 3600,
    description: 'Durasi signed URL dalam detik',
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  expires_in?: number = 3600;
}