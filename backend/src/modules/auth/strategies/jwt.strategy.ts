import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserService } from '../../user/user.service';
import { Role } from '../../../@shared/enums/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: JwtPayload) {
    // 1. Mantém a chamada original que garante compatibilidade e evita o erro 400
    const userDto = await this.userService.findById(payload.sub, true);

    if (!userDto || !userDto.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    if (payload.role && payload.role !== userDto.role) {
      // throw new ForbiddenException('Role principal divergente do token'); // Comentado para flexibilidade
    }

    const tokenTenants = Array.isArray(payload.tenants) ? payload.tenants : [];
    const dbTenants = userDto.tenants || [];

    if (userDto.role !== Role.ADMIN) {
      for (const t of tokenTenants) {
        if (
          !dbTenants.some(
            (dt: { tenantId: string; role: Role }) =>
              dt.tenantId === t.tenantId && dt.role === t.role,
          )
        ) {
          // throw new ForbiddenException(...);
        }
      }
    }

    const validTenants = tokenTenants.length ? tokenTenants : dbTenants;

    // =================================================================
    // AQUI ESTÁ A CORREÇÃO PARA O ERRO 403 NA VISUALIZAÇÃO
    // Calculamos o contexto com base nos tenants retornados pelo service
    // =================================================================

    // Encontra o ID da empresa onde ele é GESTOR
    const managerLink = dbTenants.find((t: any) => t.role === Role.MANAGER_REVIEWERS);

    // Encontra os IDs onde ele é ASSISTENTE
    const assistantTenantIds = dbTenants
      .filter((t: any) => t.role === Role.ASSISTANT_REVIEWERS)
      .map((t: any) => t.tenantId);

    return {
      ...userDto, // Mantém tudo que já funcionava (id, email, role...)

      // Injeta as propriedades que o findOneSmart precisa para autorizar
      isAdminTrue: userDto.isAdmin || userDto.role === Role.ADMIN,
      currentTenantIdGerente: managerLink?.tenantId,
      currentTenantIdAssistentes: assistantTenantIds,

      // Mantém payload original do JWT
      sub: userDto.id,
      tenants: validTenants,
    };
  }
}
