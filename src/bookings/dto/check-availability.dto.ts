import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckAvailabilityDto {
  @ApiProperty({
    example: [1, 2],
    description: 'ID barang yang ingin dicek',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  item_ids!: number[];

  @ApiProperty({
    example: '2026-06-10',
  })
  @IsDateString()
  rental_start_date!: string;

  @ApiProperty({
    example: '2026-06-12',
  })
  @IsDateString()
  rental_end_date!: string;
}