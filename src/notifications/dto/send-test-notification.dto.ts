import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendTestNotificationDto {
  @ApiProperty({
    example: 'Tes Notifikasi SELECT',
  })
  @IsString()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example: 'Ini adalah notifikasi percobaan dari backend SELECT.',
  })
  @IsString()
  body!: string;

  @ApiPropertyOptional({
    example: {
      screen: 'notifications',
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}