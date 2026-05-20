import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateSignedUploadUrlDto {
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
    description: 'Path file di Supabase Storage',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9/_\-.]+$/, {
    message:
      'path hanya boleh berisi huruf, angka, slash, underscore, strip, dan titik',
  })
  path!: string;

  @ApiPropertyOptional({
    example: 'image/png',
  })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  upsert?: boolean;
}