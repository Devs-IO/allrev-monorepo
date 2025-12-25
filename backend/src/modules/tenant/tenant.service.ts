import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BusinessException } from '../../@shared/exception/business.exception';
import { TenantNotFoundException } from '../../@shared/exception/tenant-not-found.exception';
import { UserTenant } from '../user/entities/user-tenant.entity';
import { Role } from '../../@shared/enums/roles.enum';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    try {
      //console.log('createTenantDto: ', createTenantDto);

      // Verifica se já existe um tenant com o mesmo código
      const existingTenant = await this.tenantRepository.findOne({
        where: { code: createTenantDto.code },
      });

      if (existingTenant) {
        throw new BusinessException('TENANT_CODE_EXISTS', 'tenant.code_already_exists', {
          code: createTenantDto.code,
        });
      }

      const tenant = this.tenantRepository.create(createTenantDto);
      //console.log('tenant: ', tenant);

      const tenantCreate = await this.tenantRepository.save(tenant);
      //console.log('tenantCreate: ', tenantCreate);

      return tenantCreate;
    } catch (error) {
      // Se é uma exceção de negócio, relança
      if (error instanceof BusinessException) {
        throw error;
      }

      // Para outros erros, cria uma exceção de negócio genérica
      throw new BusinessException('TENANT_CREATION_FAILED', 'error.internal_server');
    }
  }

  async findAll(): Promise<Tenant[]> {
    try {
      return await this.tenantRepository.find({ where: { isActive: true } });
    } catch (error) {
      throw new BusinessException('TENANT_FETCH_FAILED', 'error.internal_server');
    }
  }

  async findTenantsWithoutManager(): Promise<Tenant[]> {
    try {
      // Busca todos os tenants ativos
      const allTenants = await this.tenantRepository.find({ where: { isActive: true } });

      // Busca todos os tenants que têm um gestor (role = MANAGER_REVIEWERS)
      const tenantsWithManager = await this.userTenantRepository.find({
        where: { role: Role.MANAGER_REVIEWERS },
        select: ['tenantId'],
      });

      const tenantIdsWithManager = new Set(tenantsWithManager.map((ut) => ut.tenantId));

      // Filtra apenas os tenants que não têm gestor
      return allTenants.filter((tenant) => !tenantIdsWithManager.has(tenant.id));
    } catch (error) {
      throw new BusinessException('TENANT_FETCH_FAILED', 'error.internal_server');
    }
  }

  async findOne(id: string): Promise<Tenant> {
    try {
      const tenant = await this.tenantRepository.findOne({ where: { id } });

      if (!tenant) {
        throw new TenantNotFoundException(id);
      }

      if (tenant.isActive === false) {
        throw new BusinessException('TENANT_INACTIVE', 'tenant.inactive');
      }

      return tenant;
    } catch (error) {
      if (error instanceof TenantNotFoundException) {
        throw error;
      }

      throw new BusinessException('TENANT_FETCH_FAILED', 'error.internal_server');
    }
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<void> {
    try {
      // Verifica se o tenant existe
      await this.findOne(id);

      // Se está tentando atualizar o código, verifica se não existe outro com o mesmo código
      if (updateTenantDto.code) {
        const existingTenant = await this.tenantRepository.findOne({
          where: { code: updateTenantDto.code },
        });

        if (existingTenant && existingTenant.id !== id) {
          throw new BusinessException('TENANT_CODE_EXISTS', 'tenant.code_already_exists', {
            code: updateTenantDto.code,
          });
        }
      }

      await this.tenantRepository.update(id, updateTenantDto);
    } catch (error) {
      if (error instanceof BusinessException || error instanceof TenantNotFoundException) {
        throw error;
      }

      throw new BusinessException('TENANT_UPDATE_FAILED', 'error.internal_server');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Verifica se o tenant existe
      const tenant = await this.findOne(id);
      // Soft disable: marcar como inativo (não excluir)
      tenant.isActive = false;
      await this.tenantRepository.save(tenant);
    } catch (error) {
      if (error instanceof TenantNotFoundException) {
        throw error;
      }

      throw new BusinessException('TENANT_DELETE_FAILED', 'error.internal_server');
    }
  }
}
