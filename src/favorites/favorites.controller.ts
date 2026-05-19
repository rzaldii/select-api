import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(SupabaseAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':itemId')
  @ApiOperation({ summary: 'Customer menambahkan barang ke favorit' })
  @ApiParam({ name: 'itemId', example: 1 })
  async addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return {
      success: true,
      message: 'Barang berhasil ditambahkan ke favorit',
      data: await this.favoritesService.addFavorite(itemId, user),
    };
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Customer menghapus barang dari favorit' })
  @ApiParam({ name: 'itemId', example: 1 })
  async removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return {
      success: true,
      message: 'Barang berhasil dihapus dari favorit',
      data: await this.favoritesService.removeFavorite(itemId, user),
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Customer melihat daftar favorit miliknya' })
  async findMyFavorites(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Data favorit berhasil diambil',
      data: await this.favoritesService.findMyFavorites(user),
    };
  }
}