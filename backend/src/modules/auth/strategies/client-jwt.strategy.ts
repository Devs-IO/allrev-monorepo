import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../client/entities/client.entity';
import { Role } from '../../../@shared/enums/roles.enum';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'jwt-client') {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: any) {
    if (payload?.type !== 'client') {
      throw new UnauthorizedException('Token inválido para cliente.');
    }

    const client = await this.clientRepository.findOne({ where: { id: payload.sub } });
    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado.');
    }

    return {
      sub: client.id,
      email: client.email,
      tenantId: client.tenantId,
      role: Role.CLIENT,
      type: 'client',
    };
  }
}
