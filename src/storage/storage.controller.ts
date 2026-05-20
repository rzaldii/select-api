import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateSignedReadUrlDto } from './dto/create-signed-read-url.dto';
import { CreateSignedUploadUrlDto } from './dto/create-signed-upload-url.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(SupabaseAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('signed-upload-url')
  @ApiOperation({
    summary: 'Membuat signed upload URL untuk upload file ke Supabase Storage',
  })
  async createSignedUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSignedUploadUrlDto,
  ) {
    return {
      success: true,
      message: 'Signed upload URL berhasil dibuat',
      data: await this.storageService.createSignedUploadUrl(dto, user),
    };
  }

  @Post('signed-read-url')
  @ApiOperation({
    summary: 'Membuat signed read URL untuk membaca file private',
  })
  async createSignedReadUrl(@Body() dto: CreateSignedReadUrlDto) {
    return {
      success: true,
      message: 'Signed read URL berhasil dibuat',
      data: await this.storageService.createSignedReadUrl(dto),
    };
  }

  @Get('public-url')
  @ApiOperation({
    summary: 'Membuat public URL untuk bucket public',
  })
  @ApiQuery({
    name: 'bucket',
    example: 'item-images',
  })
  @ApiQuery({
    name: 'path',
    example: 'camera/sony-alpha-a7-iv/main.png',
  })
  getPublicUrl(
    @Query('bucket') bucket: string,
    @Query('path') path: string,
  ) {
    return {
      success: true,
      message: 'Public URL berhasil dibuat',
      data: this.storageService.getPublicUrl(bucket, path),
    };
  }
}