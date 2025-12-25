import { Role } from '../../../@shared/enums/roles.enum';

export interface JwtPayload {
  sub: string; // ID do usuário
  email: string; // Email do usuário
  role: Role; // Papel principal
  isAdmin: boolean; // Flag de admin
  // tenantIds removido: agora usamos apenas lista detalhada abaixo
  tenants: { tenantId: string; role: Role }[]; // vínculos detalhados (podem conter ADMIN/MANAGER/ASSISTANT)
  mustChangePassword?: boolean; // exige troca de senha no primeiro acesso
}
