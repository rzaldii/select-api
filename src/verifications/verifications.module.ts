import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VerificationsController],
  providers: [VerificationsService, SupabaseAuthGuard, RolesGuard],
})
export class VerificationsModule {}