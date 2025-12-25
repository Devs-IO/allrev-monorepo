import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ClientLoginDto } from '../client/dto/client-login.dto';
import { Client } from '../client/entities/client.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    // Suporta hashes legados/planos: tenta bcrypt, depois compara plano e re-hash
    const matchesBcrypt = user.password ? await bcrypt.compare(password, user.password) : false;
    if (matchesBcrypt) {
      return user;
    }

    // Fallback: senha pode estar salva em texto plano ou outro formato não-bcrypt
    if (user.password === password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await this.userRepository.save(user); // normaliza para bcrypt
      return user;
    }

    return null;
  }

  // Constrói JwtPayload completo com base no usuário
  private async buildJwtPayload(userId: string, email: string): Promise<JwtPayload> {
    const basic = await this.userService.findById(userId, true); // internal usage
    const tenants = basic.tenants || [];

    return {
      sub: userId,
      email,
      role: basic.role,
      isAdmin: basic.isAdmin,
      tenants,
    };
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'supersecretkey',
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'supersecretkey',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const userEntity = await this.validateUser(email, password);

    if (!userEntity) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!userEntity.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const payload = await this.buildJwtPayload(userEntity.id, userEntity.email);

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.updateRefreshToken(userEntity.id, refreshToken);

    // Usa DTO para retornar usuário simplificado
    const responseUser = await this.userService.findById(userEntity.id, true);

    return {
      accessToken,
      refreshToken,
      user: responseUser,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const userEntity = await this.userService['userRepository'].findOne({ where: { id: userId } });
    if (!userEntity || !userEntity.refreshToken) {
      throw new UnauthorizedException('Usuário não encontrado ou não autenticado');
    }

    const valid = await bcrypt.compare(refreshToken, userEntity.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Token inválido');
    }

    const payload = await this.buildJwtPayload(userEntity.id, userEntity.email);
    const accessToken = this.signAccessToken(payload);
    const newRefreshToken = this.signRefreshToken(payload);
    await this.updateRefreshToken(userEntity.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    // Tenta buscar como User primeiro
    let user = await this.userRepository.findOne({ where: { id: userId } });

    if (user) {
      // É um User (Admin/Gerente/Assistente)
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.mustChangePassword = false;
      await this.userRepository.save(user);
      return;
    }

    // Se não for User, tenta como Client
    const client = await this.clientRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'],
    });

    if (!client) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // É um Cliente
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(newPassword, salt);
    await this.clientRepository.save(client);
  }

  async loginClient(loginDto: ClientLoginDto) {
    const { email, password } = loginDto;

    // 1. Busca o cliente pelo email (incluindo o campo password que está oculto)
    const client = await this.clientRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'tenantId'],
    });

    // 2. Validações
    if (!client) {
      throw new UnauthorizedException('Credenciais inválidas (Cliente não encontrado).');
    }

    if (!client.password) {
      throw new UnauthorizedException(
        'Este cliente ainda não definiu uma senha de acesso. Solicite o reset.',
      );
    }

    // 3. Checa a senha (Hash)
    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 4. Gera o Token JWT com a flag de PORTAL
    const payload = {
      sub: client.id,
      email: client.email,
      tenantId: client.tenantId,
      role: 'CLIENT_PORTAL', // Role especial para o Guard do Frontend
      type: 'client',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        role: 'CLIENT',
      },
    };
  }
}
