import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { TenantService } from '../tenant/tenant.service';
import { BusinessException } from '../../@shared/exception/business.exception';
import { ClientNotFoundException } from '../../@shared/exception/client-not-found.exception';
import { GetUserDto } from '../../@shared/dto/get-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    private readonly tenantService: TenantService,
    private readonly emailService: EmailService,
  ) {}

  private generateTempPassword(): string {
    return [
      ...crypto
        .randomBytes(8)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, ''),
    ]
      .join('')
      .slice(0, 10);
  }

  private async syncPasswordForEmail(email: string, plainPassword: string) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    await this.clientRepo
      .createQueryBuilder()
      .update(Client)
      .set({ password: hashed })
      .where('email = :email', { email })
      .execute();
    return hashed;
  }

  private nullifyEmpty<T extends Record<string, any>>(obj: T): T {
    const clone: any = { ...obj };
    // Apenas campos opcionais podem ir como null
    const optionalKeys = new Set([
      'phone',
      'course',
      'university',
      'institution',
      'observation',
      'note',
      'description',
      'legalNature',
      'cpf',
      'cnpj',
    ]);
    for (const k of Object.keys(clone)) {
      const v = clone[k];
      if (optionalKeys.has(k) && v === '') clone[k] = null;
    }
    return clone;
  }

  async create(createDto: CreateClientDto, currentUser?: GetUserDto): Promise<Client> {
    try {
      // Campos obrigatórios
      if (!createDto.name || !createDto.name.trim()) {
        throw new BusinessException('INVALID_CLIENT_NAME', 'client.name_required');
      }
      if (!createDto.email || !createDto.email.trim()) {
        throw new BusinessException('INVALID_CLIENT_EMAIL', 'client.email_required');
      }
      if (!createDto.tenantId || !createDto.tenantId.trim()) {
        throw new BusinessException('INVALID_TENANT_ID', 'tenant.invalid_id');
      }
      // Permissão extra: apenas gestor do próprio tenant (não Admin)
      if (currentUser) {
        if (!currentUser.currentTenantIdGerente || currentUser.isAdminTrue) {
          throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
        }
        if (createDto.tenantId !== currentUser.currentTenantIdGerente) {
          throw new BusinessException('FORBIDDEN', 'client.invalid_tenant_context');
        }
      }

      const tenant = await this.tenantService.findOne(createDto.tenantId);
      if (!tenant) {
        throw new BusinessException('TENANT_NOT_FOUND', 'tenant.not_found', {
          tenantId: createDto.tenantId,
        });
      }

      // Unicidade por tenant
      const emailExistsInTenant = await this.clientRepo.findOne({
        where: { tenantId: createDto.tenantId, email: createDto.email },
      });
      if (emailExistsInTenant) {
        throw new BusinessException('CLIENT_EMAIL_EXISTS', 'client.email_already_exists');
      }

      // Busca qualquer cliente existente com mesmo e-mail (qualquer tenant) para reaproveitar senha
      const existingAnyEmail = await this.clientRepo
        .createQueryBuilder('c')
        .addSelect('c.password')
        .where('c.email = :email', { email: createDto.email })
        .getOne();

      const normalized = this.nullifyEmpty(createDto as any);
      const client = new Client();
      client.tenant = tenant;
      client.tenantId = createDto.tenantId;
      client.name = normalized.name;
      client.email = normalized.email;
      if (normalized.phone !== undefined) client.phone = normalized.phone as any;
      if (normalized.course !== undefined) client.course = normalized.course as any;
      if (normalized.university !== undefined) client.university = normalized.university as any;
      if (normalized.institution !== undefined) client.institution = normalized.institution as any;
      if (normalized.observation !== undefined) client.observation = normalized.observation as any;
      if (normalized.note !== undefined) client.note = normalized.note as any;
      if (normalized.legalNature !== undefined) client.legalNature = normalized.legalNature as any;
      // Decide se vamos gerar/enviar senha: se já existir em outro tenant, reutiliza hash e não envia email
      let plainPassword: string | undefined;
      if (existingAnyEmail?.password) {
        client.password = existingAnyEmail.password;
      } else {
        plainPassword = normalized.password;
        if (!plainPassword && createDto.sendPassword) {
          plainPassword = this.generateTempPassword();
        }

        if (plainPassword) {
          const hashed = await this.syncPasswordForEmail(client.email, plainPassword);
          client.password = hashed;
        }
      }

      const saved = await this.clientRepo.save(client);

      // Enviar email se senha foi gerada/informada
      if (plainPassword) {
        const baseUrlEnv = process.env.APP_BASE_URL?.trim();
        const loginLink = baseUrlEnv
          ? `${baseUrlEnv.replace(/\/+$/, '')}/portal/login`
          : '/portal/login';
        try {
          await this.emailService.sendWelcomeEmail(client.email, plainPassword, loginLink);
        } catch (err) {
          // Log já feito no EmailService; não impede criação
        }
      }

      return saved;
      if (normalized.cnpj !== undefined) client.cnpj = normalized.cnpj as any;
      await this.clientRepo.save(client);
    } catch (error) {
      // Se é uma exceção de negócio, relança
      if (error instanceof BusinessException) {
        throw error;
      }

      // Para outros erros, cria uma exceção de negócio genérica
      throw new BusinessException('CLIENT_CREATION_FAILED', 'error.internal_server');
    }
  }

  async findAll(tenantId: string): Promise<Client[]> {
    try {
      if (!tenantId) {
        // Se chegou aqui sem tenantId, erro.
        throw new BusinessException('INVALID_TENANT_ID', 'tenant.invalid_id');
      }
      // Removemos a verificação rígida de 'isAdminTrue' ou 'currentTenantIdGerente' aqui
      // pois o Controller já filtrou quem pode chamar. O Service confia no tenantId passado.

      return await this.clientRepo.find({ where: { tenant: { id: tenantId } } });
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException('CLIENT_FETCH_FAILED', 'error.internal_server');
    }
  }

  async findOne(id: string, tenantId: string): Promise<Client> {
    try {
      if (!id || !tenantId) {
        throw new BusinessException('INVALID_DATA', 'Dados incompletos para busca');
      }

      // Adicionamos withDeleted: false para garantir que não traga soft-deleted
      const client = await this.clientRepo.findOne({
        where: { id, tenant: { id: tenantId } },
      });

      if (!client) {
        throw new ClientNotFoundException(id);
      }

      return client;
    } catch (error) {
      if (error instanceof BusinessException || error instanceof ClientNotFoundException) {
        throw error;
      }
      throw new BusinessException('CLIENT_FETCH_FAILED', 'error.internal_server');
    }
  }

  async update(
    id: string,
    updateDto: UpdateClientDto,
    tenantId: string,
    currentUser?: GetUserDto,
  ): Promise<void> {
    try {
      // Permissão extra
      if (currentUser) {
        if (!currentUser.currentTenantIdGerente || currentUser.isAdminTrue) {
          throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
        }
        if (tenantId !== currentUser.currentTenantIdGerente) {
          throw new BusinessException('FORBIDDEN', 'client.invalid_tenant_context');
        }
      }
      // Verifica se o client existe
      const existing = await this.findOne(id, tenantId);

      // Unicidade de email no mesmo tenant (se fornecido)
      if (updateDto.email && updateDto.email !== existing.email) {
        const dup = await this.clientRepo.findOne({
          where: { tenantId, email: updateDto.email },
        });
        if (dup && dup.id !== id) {
          throw new BusinessException('CLIENT_EMAIL_EXISTS', 'client.email_already_exists');
        }
      }

      // Se vier name/email, validar não vazios
      if (updateDto.name !== undefined && !String(updateDto.name).trim()) {
        throw new BusinessException('INVALID_CLIENT_NAME', 'client.name_required');
      }
      if (updateDto.email !== undefined && !String(updateDto.email).trim()) {
        throw new BusinessException('INVALID_CLIENT_EMAIL', 'client.email_required');
      }

      const normalized = this.nullifyEmpty(updateDto as any);

      // Se vier senha, aplica hash e sincroniza para todos os registros com o mesmo e-mail (multi-tenant)
      if (updateDto.password) {
        const targetEmail = (updateDto.email ?? existing.email).trim();
        const hashed = await bcrypt.hash(updateDto.password, 10);

        // Atualiza todos os clientes com este e-mail em qualquer tenant
        await this.clientRepo
          .createQueryBuilder()
          .update(Client)
          .set({ password: hashed })
          .where('email = :email', { email: targetEmail })
          .execute();

        // Evita salvar texto plano em normalized
        delete (normalized as any).password;
      }

      await this.clientRepo.update({ id, tenant: { id: tenantId } }, normalized as Client);
    } catch (error) {
      if (error instanceof BusinessException || error instanceof ClientNotFoundException) {
        throw error;
      }

      throw new BusinessException('CLIENT_UPDATE_FAILED', 'error.internal_server');
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Verifica se o client existe
      const client = await this.findOne(id, tenantId);
      // Desativar (não excluir)
      client.isActive = false;
      await this.clientRepo.save(client);
    } catch (error) {
      if (error instanceof BusinessException || error instanceof ClientNotFoundException) {
        throw error;
      }

      throw new BusinessException('CLIENT_DELETE_FAILED', 'error.internal_server');
    }
  }

  async resendPassword(id: string, tenantId: string): Promise<void> {
    // Gera nova senha, sincroniza em todas as instâncias do e-mail e envia
    const client = await this.findOne(id, tenantId);
    const plainPassword = this.generateTempPassword();
    await this.syncPasswordForEmail(client.email, plainPassword);

    const baseUrlEnv = process.env.APP_BASE_URL?.trim();
    const loginLink = baseUrlEnv
      ? `${baseUrlEnv.replace(/\/+$/, '')}/portal/login`
      : '/portal/login';
    try {
      await this.emailService.sendWelcomeEmail(client.email, plainPassword, loginLink);
    } catch (err) {
      // Log já no EmailService; não bloqueia
    }
  }

  async validateClients(clientIds: string[], tenantId: string): Promise<boolean> {
    if (!clientIds || clientIds.length === 0) {
      return true;
    }

    const clients = await this.clientRepo
      .createQueryBuilder('client')
      .where('client.id IN (:...clientIds)', { clientIds })
      .andWhere('client.tenantId = :tenantId', { tenantId })
      .andWhere('client.is_active = :active', { active: true })
      .getMany();

    return clients.length === clientIds.length;
  }

  async findClientsByIds(clientIds: string[], tenantId: string): Promise<Client[]> {
    if (!clientIds || clientIds.length === 0) {
      return [];
    }

    return this.clientRepo
      .createQueryBuilder('client')
      .where('client.id IN (:...clientIds)', { clientIds })
      .andWhere('client.tenantId = :tenantId', { tenantId })
      .andWhere('client.is_active = :active', { active: true })
      .getMany();
  }
}
