import { UserRole } from '../entities/tenant.entity';

export interface ProcessFinancialContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}
