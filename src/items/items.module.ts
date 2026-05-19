import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, SupabaseAuthGuard, RolesGuard],
})
export class ItemsModule {}