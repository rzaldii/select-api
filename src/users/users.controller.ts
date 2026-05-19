import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/me')
  @ApiOperation({ summary: 'Mengambil profil user yang sedang login' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Profil berhasil diambil',
      data: await this.usersService.getMe(user.profile.id),
    };
  }

  @Patch('users/me')
  @ApiOperation({ summary: 'Mengubah profil user yang sedang login' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ) {
    return {
      success: true,
      message: 'Profil berhasil diperbarui',
      data: await this.usersService.updateMe(user.profile.id, dto),
    };
  }

  @Get('admin/users')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin melihat semua user' })
  async findAllUsers() {
    return {
      success: true,
      message: 'Data user berhasil diambil',
      data: await this.usersService.findAllUsers(),
    };
  }

  @Patch('admin/users/:id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin mengubah role user' })
  @ApiParam({ name: 'id', example: 2 })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return {
      success: true,
      message: 'Role user berhasil diperbarui',
      data: await this.usersService.updateUserRole(id, dto),
    };
  }
}