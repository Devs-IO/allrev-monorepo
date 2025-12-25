import { Role } from '../enums';

export interface GetUserDto {
  id: string;
  email: string;
  role: Role;
  currentTenantIdAdmin?: string | null;
  currentTenantIdGerente: string;
  currentTenantIdAssistentes: string[];
  isAdminTrue: boolean;
}
