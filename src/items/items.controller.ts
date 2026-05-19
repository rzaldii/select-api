import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemQueryDto } from './dto/item-query.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemsService } from './items.service';

@ApiTags('Items')
@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Melihat daftar kategori barang aktif' })
  async findCategories() {
    return {
      success: true,
      message: 'Kategori berhasil diambil',
      data: await this.itemsService.findCategories(),
    };
  }

  @Get('items')
  @ApiOperation({ summary: 'Melihat daftar barang elektronik' })
  async findAll(@Query() query: ItemQueryDto) {
    const result = await this.itemsService.findAll(query);

    return {
      success: true,
      message: 'Data barang berhasil diambil',
      data: result.items,
      meta: result.meta,
    };
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Melihat detail barang elektronik' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Detail barang berhasil diambil',
      data: await this.itemsService.findOne(id),
    };
  }

  @Post('admin/items')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menambahkan barang elektronik' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateItemDto,
  ) {
    return {
      success: true,
      message: 'Barang berhasil ditambahkan',
      data: await this.itemsService.create(dto, user.profile.id),
    };
  }

  @Patch('admin/items/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin mengubah data barang elektronik' })
  @ApiParam({ name: 'id', example: 1 })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return {
      success: true,
      message: 'Barang berhasil diperbarui',
      data: await this.itemsService.update(id, dto, user.profile.id),
    };
  }

  @Delete('admin/items/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menonaktifkan barang elektronik' })
  @ApiParam({ name: 'id', example: 1 })
  async softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Barang berhasil dinonaktifkan',
      data: await this.itemsService.softDelete(id, user.profile.id),
    };
  }
}