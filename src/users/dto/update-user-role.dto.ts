import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'admin',
    enum: ['customer', 'admin'],
  })
  @IsIn(['customer', 'admin'])
  role!: 'customer' | 'admin';
}