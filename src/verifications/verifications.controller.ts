import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateConditionVerificationDto } from './dto/create-condition-verification.dto';
import { CreateIdentityVerificationDto } from './dto/create-identity-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { VerificationsService } from './verifications.service';

@ApiTags('Verifications')
@ApiBearerAuth()
@Controller()
@UseGuards(SupabaseAuthGuard)
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post('verifications/identity')
  @ApiOperation({ summary: 'Customer mengirim verifikasi KTP + GPS' })
  async submitIdentityVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIdentityVerificationDto,
  ) {
    return {
      success: true,
      message: 'Verifikasi identitas berhasil dikirim',
      data: await this.verificationsService.submitIdentityVerification(
        dto,
        user,
      ),
    };
  }

  @Post('verifications/condition')
  @ApiOperation({
    summary: 'Customer mengirim foto kondisi barang sebelum/sesudah sewa',
  })
  async submitConditionVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConditionVerificationDto,
  ) {
    return {
      success: true,
      message: 'Verifikasi kondisi barang berhasil dikirim',
      data: await this.verificationsService.submitConditionVerification(
        dto,
        user,
      ),
    };
  }

  @Get('admin/verifications/identity')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin melihat semua verifikasi identitas' })
  async findIdentityVerificationsForAdmin() {
    return {
      success: true,
      message: 'Data verifikasi identitas berhasil diambil',
      data: await this.verificationsService.findIdentityVerificationsForAdmin(),
    };
  }

  @Get('admin/verifications/condition')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin melihat semua verifikasi kondisi barang' })
  async findConditionVerificationsForAdmin() {
    return {
      success: true,
      message: 'Data verifikasi kondisi barang berhasil diambil',
      data: await this.verificationsService.findConditionVerificationsForAdmin(),
    };
  }

  @Patch('admin/verifications/identity/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menyetujui verifikasi identitas' })
  @ApiParam({ name: 'id', example: 1 })
  async approveIdentityVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Verifikasi identitas berhasil disetujui',
      data: await this.verificationsService.approveIdentityVerification(
        id,
        user,
      ),
    };
  }

  @Patch('admin/verifications/identity/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menolak verifikasi identitas' })
  @ApiParam({ name: 'id', example: 1 })
  async rejectIdentityVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectVerificationDto,
  ) {
    return {
      success: true,
      message: 'Verifikasi identitas berhasil ditolak',
      data: await this.verificationsService.rejectIdentityVerification(
        id,
        user,
        dto,
      ),
    };
  }

  @Patch('admin/verifications/condition/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menyetujui verifikasi kondisi barang' })
  @ApiParam({ name: 'id', example: 1 })
  async approveConditionVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Verifikasi kondisi barang berhasil disetujui',
      data: await this.verificationsService.approveConditionVerification(
        id,
        user,
      ),
    };
  }

  @Patch('admin/verifications/condition/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin menolak verifikasi kondisi barang' })
  @ApiParam({ name: 'id', example: 1 })
  async rejectConditionVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectVerificationDto,
  ) {
    return {
      success: true,
      message: 'Verifikasi kondisi barang berhasil ditolak',
      data: await this.verificationsService.rejectConditionVerification(
        id,
        user,
        dto,
      ),
    };
  }
}