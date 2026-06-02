import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'customer@test.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'Customer Test',
  })
  @IsString()
  @MaxLength(120)
  full_name!: string;

  @ApiPropertyOptional({
    example: '081234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}