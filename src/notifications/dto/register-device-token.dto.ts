import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'fcm_token_dari_flutter',
  })
  @IsString()
  fcm_token!: string;

  @ApiProperty({
    example: 'android',
    enum: ['android', 'ios', 'web'],
  })
  @IsIn(['android', 'ios', 'web'])
  platform!: 'android' | 'ios' | 'web';

  @ApiPropertyOptional({
    example: 'Iqbal Android Phone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  device_name?: string;
}