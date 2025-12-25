import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1) lê roles exigidas pelo decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2) obtém payload do JWT (conforme JwtStrategy)
    const { user } = context.switchToHttp().getRequest();
    const payload = user as { tenants: { tenantId: string; role: Role }[] };
    if (!payload?.tenants) {
      throw new ForbiddenException('Payload inválido: sem tenants');
    }

    // 3) extrai todos os papéis desse usuário
    const userRoles = payload.tenants.map((t) => t.role);

    // 4) verifica se algum dos papéis exigidos está presente
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Usuário não possui o papel necessário');
    }

    return true;
  }
}
