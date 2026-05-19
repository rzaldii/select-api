import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, SupabaseAuthGuard],
})
export class ReviewsModule {}