import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateSignedReadUrlDto } from './dto/create-signed-read-url.dto';
import { CreateSignedUploadUrlDto } from './dto/create-signed-upload-url.dto';

const PUBLIC_BUCKETS = ['item-images', 'profile-photos'];

@Injectable()
export class StorageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private getStoragePathPrefix(user: AuthenticatedUser) {
    return `users/${user.profile.id}`;
  }

  private isPublicBucket(bucket: string) {
    return PUBLIC_BUCKETS.includes(bucket);
  }

  private validatePath(path: string) {
    if (path.startsWith('/')) {
      throw new BadRequestException('Path tidak boleh diawali slash');
    }

    if (path.includes('..')) {
      throw new BadRequestException('Path tidak boleh mengandung ..');
    }
  }

  async createSignedUploadUrl(
    dto: CreateSignedUploadUrlDto,
    user: AuthenticatedUser,
  ) {
    this.validatePath(dto.path);

    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.storage
      .from(dto.bucket)
      .createSignedUploadUrl(dto.path, {
        upsert: dto.upsert ?? false,
      });

    if (error) {
      throw new BadRequestException({
        message: 'Gagal membuat signed upload URL',
        supabase_error: error.message,
      });
    }

    return {
      bucket: dto.bucket,
      path: dto.path,
      signed_url: data.signedUrl,
      token: data.token,
      full_path: data.path,
      content_type: dto.content_type ?? null,
      expires_in_note: 'Signed upload URL berlaku sekitar 2 jam',
      owner_hint: this.getStoragePathPrefix(user),
    };
  }

  async createSignedReadUrl(dto: CreateSignedReadUrlDto) {
    this.validatePath(dto.path);

    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.storage
      .from(dto.bucket)
      .createSignedUrl(dto.path, dto.expires_in ?? 3600);

    if (error) {
      throw new NotFoundException({
        message: 'Gagal membuat signed read URL',
        supabase_error: error.message,
      });
    }

    return {
      bucket: dto.bucket,
      path: dto.path,
      signed_url: data.signedUrl,
      expires_in: dto.expires_in ?? 3600,
    };
  }

  getPublicUrl(bucket: string, path: string) {
    this.validatePath(path);

    if (!this.isPublicBucket(bucket)) {
      throw new BadRequestException(
        'Public URL hanya boleh dibuat untuk bucket public',
      );
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      bucket,
      path,
      public_url: data.publicUrl,
    };
  }
}