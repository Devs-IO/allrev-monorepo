import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/roles.enum';

/**
 * TenantGuard
 * Valida que o tenantId do path param pertence aos tenants autorizados do usuário (JWT).
 * Regras:
 * - ADMIN sempre permitido (ignora validação de tenantId)
 * - Se não houver parâmetro :tenantId na rota, passa.
 * - Se houver e não estiver na lista de tenants do usuário, lança Forbidden.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      role: Role;
      isAdmin?: boolean;
      tenants?: { tenantId: string; role: Role }[];
    };
    const tenantIdParam: string | undefined = request.params?.tenantId;

    if (!tenantIdParam) return true; // rota não exige validação de tenant

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.role === Role.ADMIN || user.isAdmin) return true; // admin bypass

    const tenantLinks = Array.isArray(user.tenants) ? user.tenants : [];
    if (!tenantLinks.some((t) => t.tenantId === tenantIdParam)) {
      throw new ForbiddenException('Acesso negado ao tenant informado');
    }

    return true;
  }
}
