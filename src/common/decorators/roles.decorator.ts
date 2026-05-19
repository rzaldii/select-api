import { SetMetadata } from '@nestjs/common';
import { AppUserRole } from '../interfaces/authenticated-request.interface';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppUserRole[]) => SetMetadata(ROLES_KEY, roles);