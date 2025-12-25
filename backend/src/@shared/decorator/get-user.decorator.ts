import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { Role } from '../enums/roles.enum';
import type { GetUserDto } from '../dto/get-user.dto';

export const GetUser = createParamDecorator(async (_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const payload = request.user as JwtPayload & { email: string };

  if (!payload.sub) {
    throw new BadRequestException('Usuário não encontrado.');
  }

  const tenants = Array.isArray(payload.tenants) ? payload.tenants : [];

  const gerenteLink = tenants.find((t) => t.role === Role.MANAGER_REVIEWERS);
  const currentTenantIdGerente = gerenteLink ? gerenteLink.tenantId : '';

  const currentTenantIdAssistentes = tenants
    .filter((t) => t.role === Role.ASSISTANT_REVIEWERS)
    .map((t) => t.tenantId);

  const isAdminTrue = tenants.some((t) => t.role === Role.ADMIN);

  const result: GetUserDto = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    currentTenantIdGerente,
    currentTenantIdAssistentes,
    isAdminTrue,
  };
  return result;
});
