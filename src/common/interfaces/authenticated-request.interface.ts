import { Request } from 'express';

export type AppUserRole = 'customer' | 'admin';

export interface AuthenticatedUser {
  authUserId: string;
  email: string | null;
  profile: {
    id: number;
    auth_user_id: string | null;
    full_name: string;
    username: string | null;
    email: string;
    phone: string | null;
    role: AppUserRole;
    avatar_path: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  };
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}