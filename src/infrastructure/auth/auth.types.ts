import { UserRole } from '@entities';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface TenantRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}
