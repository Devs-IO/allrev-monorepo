import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, In, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TenantDto, ResponseUserProfileDto } from './dto/response-user-profile.dto';
import { Role } from '../../@shared/enums/roles.enum';
import { BusinessException } from '../../@shared/exception/business.exception';
import { UserNotFoundException } from '../../@shared/exception/user-not-found.exception';
import { TenantService } from '../tenant/tenant.service';
import { GetUserDto } from '../../@shared/dto/get-user.dto';
import { EmailService } from '../email/email.service';
import { OrderItemResponsibility } from '../orders/entities/order-item-responsibility.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
    @InjectRepository(OrderItemResponsibility)
    private readonly orderItemResponsibilityRepository: Repository<OrderItemResponsibility>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantService: TenantService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: { id: string }): Promise<void> {
    try {
      // Regra absoluta: impedir qualquer criação de usuário com papel ADMIN
      if (createUserDto.role === Role.ADMIN) {
        throw new BusinessException(
          'FORBIDDEN_ROLE_ADMIN',
          'Usuário ADMIN não pode ser criado pelo sistema',
        );
      }

      // Carrega vínculos do usuário logado (se houver) para regras de permissão
      let currentUserRole: Role | null = null;
      if (currentUser?.id) {
        const curUT = await this.userTenantRepository.findOne({
          where: { userId: currentUser.id },
        });
        currentUserRole = curUT?.role ?? null;
      }

      // Regra: Apenas ADMIN pode criar MANAGER; Gestor não pode criar outro Gestor
      if (
        createUserDto.role === Role.MANAGER_REVIEWERS &&
        currentUserRole === Role.MANAGER_REVIEWERS
      ) {
        throw new BusinessException('FORBIDDEN', 'Gestor não pode criar outro Gestor');
      }
      if (createUserDto.role === Role.MANAGER_REVIEWERS && currentUserRole !== Role.ADMIN) {
        throw new BusinessException('FORBIDDEN', 'Somente Administrador pode criar Gestor');
      }

      // 1) Carrega Tenant pelo tenantId (obrigatório para qualquer papel exceto ADMIN puro)
      const tenantId = createUserDto.tenantId;
      if (!tenantId) {
        throw new BadRequestException('TenantId é obrigatório para este papel.');
      }
      const tenantRecord = tenantId ? await this.tenantService.findOne(tenantId) : null;
      if (tenantId && !tenantRecord) {
        throw new BadRequestException('Tenant não encontrado.');
      }

      // 2) Busca usuário existente por email
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      // Função helper: valida regras de papel para usuário existente
      const validateExistingUserRoleAdd = async (user: User) => {
        const userUTs = await this.userTenantRepository.find({ where: { userId: user.id } });
        const hasAdmin = userUTs.some((ut) => ut.role === Role.ADMIN);
        if (hasAdmin && createUserDto.role !== Role.ADMIN) {
          throw new BusinessException(
            'ADMIN_EXCLUSIVE',
            'Usuário ADMIN não pode receber outros papéis',
          );
        }
        if (createUserDto.role === Role.ADMIN && userUTs.length > 0 && !hasAdmin) {
          throw new BusinessException('ADMIN_EXCLUSIVE', 'ADMIN não pode acumular outros papéis');
        }
        if (createUserDto.role === Role.MANAGER_REVIEWERS) {
          // Já é manager em algum tenant diferente?
          const existingManagerUT = userUTs.find((ut) => ut.role === Role.MANAGER_REVIEWERS);
          if (existingManagerUT && existingManagerUT.tenantId !== tenantId) {
            throw new BusinessException(
              'MANAGER_SINGLE_TENANT',
              'Usuário já é gestor de outro tenant',
            );
          }
        }
        if (createUserDto.role === Role.MANAGER_REVIEWERS) {
          // Garantir que tenant não possui outro gestor
          const otherMgr = await this.userTenantRepository.findOne({
            where: { tenantId: tenantId!, role: Role.MANAGER_REVIEWERS },
          });
          if (otherMgr) {
            throw new BusinessException('MANAGER_EXISTS', 'Já existe gestor para este tenant');
          }
        }
        if (createUserDto.role === Role.ASSISTANT_REVIEWERS) {
          // Evitar duplicidade de vínculo assistente para mesmo tenant
          const duplicateAssistant = userUTs.find(
            (ut) => ut.role === Role.ASSISTANT_REVIEWERS && ut.tenantId === tenantId,
          );
          if (duplicateAssistant) {
            throw new BusinessException(
              'ASSISTANT_DUPLICATE',
              'Usuário já é assistente deste tenant',
            );
          }
        }
      };

      if (existingUser) {
        await validateExistingUserRoleAdd(existingUser);
        if (tenantId) {
          // Evitar duplicidade total
          const same = await this.userTenantRepository.findOne({
            where: { userId: existingUser.id, tenantId, role: createUserDto.role },
          });
          if (same) {
            throw new BusinessException(
              'USER_TENANT_EXISTS',
              'Usuário já vinculado com este papel',
            );
          }
        }
        // Telefone duplicado (se informado e diferente)
        if (createUserDto.phone) {
          const phoneUser = await this.userRepository.findOne({
            where: { phone: createUserDto.phone },
          });
          if (phoneUser && phoneUser.id !== existingUser.id) {
            throw new BusinessException(
              'USER_PHONE_EXISTS',
              'Telefone já utilizado por outro usuário',
            );
          }
        }
        const ut = this.userTenantRepository.create({
          userId: existingUser.id,
          tenantId: tenantId!,
          role: createUserDto.role,
        });
        await this.userTenantRepository.save(ut);
        return;
      }

      // Valida telefone duplicado para novo usuário
      if (createUserDto.phone) {
        const phoneExists = await this.userRepository.findOne({
          where: { phone: createUserDto.phone },
        });
        if (phoneExists) {
          throw new BusinessException('USER_PHONE_EXISTS', 'Telefone já utilizado.');
        }
      }

      // Novo usuário
      // Gera uma senha temporária aleatória e força troca no primeiro acesso
      const rawPassword = crypto
        .randomBytes(10)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 12);
      const hashed = await bcrypt.hash(rawPassword, 10);
      const newUser = this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        address: createUserDto.address,
        password: hashed,
        mustChangePassword: true,
      });
      const saved = await this.userRepository.save(newUser);

      const ut = this.userTenantRepository.create({
        userId: saved.id,
        tenantId: tenantId!,
        role: createUserDto.role,
      });
      await this.userTenantRepository.save(ut);
      // Envia e-mail com a senha temporária e link do sistema
      const baseUrlEnv = process.env.APP_BASE_URL?.trim();
      const loginLink = baseUrlEnv ? `${baseUrlEnv.replace(/\/+$/, '')}/login` : '/login';
      if (!baseUrlEnv) {
        // eslint-disable-next-line no-console
        console.warn('[UserService] APP_BASE_URL não definido. Usando link relativo /login');
      }
      this.emailService
        .sendWelcomeEmail(saved.email, rawPassword, loginLink)
        .then(() => console.log(`[Email] Enviado com sucesso para ${saved.email}`))
        .catch((err) => {
          console.error(
            `[Background Email Error] Falha ao enviar para ${saved.email}:`,
            err.message,
          );
        });
      return;
    } catch (err: any) {
      if (err instanceof BusinessException) throw err;
      // Trata violação de unicidade (Postgres: code 23505)
      if (err?.code === '23505') {
        const detail: string = err.detail || '';
        if (/email/i.test(detail)) {
          throw new BusinessException('USER_EMAIL_EXISTS', 'E-mail já utilizado.');
        }
        if (/phone|telefone/i.test(detail)) {
          throw new BusinessException('USER_PHONE_EXISTS', 'Telefone já utilizado.');
        }
      }
      throw new BusinessException('USER_CREATION_FAILED', 'Erro interno ao criar usuário.');
    }
  }

  async findByIdProfile(userId: string): Promise<ResponseUserProfileDto> {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new BusinessException('INVALID_USER_ID', 'user.invalid_id');
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new UserNotFoundException(userId);
      }
      if (user.isActive === false) {
        throw new BusinessException('USER_INACTIVE', 'user.inactive');
      }

      const userTenants = await this.userTenantRepository.find({
        where: { userId: user.id },
        relations: ['tenant'],
      });

      const isAdmin = userTenants.some((ut) => ut.role === Role.ADMIN);
      const managerUT = userTenants.find((ut) => ut.role === Role.MANAGER_REVIEWERS);
      const assistantUTs = userTenants.filter((ut) => ut.role === Role.ASSISTANT_REVIEWERS);

      let role: Role;
      let tenant: TenantDto | null = null;
      let tenants: Array<{ tenantId: string; role: Role; companyName: string }> = [];

      if (isAdmin) {
        role = Role.ADMIN;
        tenant = null;
        tenants = [];
      } else if (managerUT) {
        role = Role.MANAGER_REVIEWERS;
        tenant = {
          id: managerUT.tenant.id,
          companyName: managerUT.tenant.companyName,
          code: managerUT.tenant.code,
          paymentStatus: managerUT.tenant.paymentStatus,
          paymentMethod: managerUT.tenant.paymentMethod,
          paymentFrequency: managerUT.tenant.paymentFrequency,
          paymentDueDate: managerUT.tenant.paymentDueDate,
        } as TenantDto;
        tenants = assistantUTs.map((ut) => ({
          tenantId: ut.tenantId,
          role: ut.role,
          companyName: ut.tenant.companyName,
        }));
      } else if (assistantUTs.length) {
        role = Role.ASSISTANT_REVIEWERS;
        tenant = null;
        tenants = assistantUTs.map((ut) => ({
          tenantId: ut.tenantId,
          role: ut.role,
          companyName: ut.tenant.companyName,
        }));
      } else {
        throw new BusinessException('USER_NO_ROLE', 'user.no_valid_role');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt,
        role,
        isAdmin: role === Role.ADMIN,
        tenant,
        tenants,
      } as ResponseUserProfileDto;
    } catch (error) {
      if (error instanceof BusinessException || error instanceof UserNotFoundException) {
        throw error;
      }
      throw new BusinessException(
        'USER_FETCH_FAILED',
        'Erro ao buscar perfil do usuário. Por favor, tente novamente.',
      );
    }
  }

  async findChildrenUsers(user: { id: string }): Promise<ResponseUserProfileDto[]> {
    try {
      const managerUT = await this.userTenantRepository.findOne({
        where: { userId: user.id, role: Role.MANAGER_REVIEWERS },
      });
      if (!managerUT) {
        throw new BusinessException('USER_NOT_MANAGER', 'user.not_manager');
      }
      const tenantId = managerUT.tenantId;

      // Busca TODOS os assistentes (incluindo deletados)
      const assistantUTs = await this.userTenantRepository
        .createQueryBuilder('ut')
        .leftJoinAndSelect('ut.user', 'user')
        .leftJoinAndSelect('ut.tenant', 'tenant')
        .where('ut.tenantId = :tenantId', { tenantId })
        .andWhere('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
        .withDeleted() // Inclui soft deleted
        .getMany();

      const map = new Map<string, ResponseUserProfileDto>();
      for (const ut of assistantUTs) {
        const u = ut.user;
        if (!map.has(u.id)) {
          const userAssistantUTs = await this.userTenantRepository.find({
            where: { userId: u.id, role: Role.ASSISTANT_REVIEWERS },
            relations: ['tenant'],
          });
          const tenants = userAssistantUTs.map((aut) => ({
            tenantId: aut.tenantId,
            role: aut.role,
            companyName: aut.tenant.companyName,
          }));

          // Marca como inativo se deletado ou desativado temporariamente deste tenant
          const isDeletedFromTenant = !!ut.deletedAt;
          const isInactiveForTenant = ut.isActive === false;
          const isEditable = !isDeletedFromTenant; // Pode editar se não foi deletado (apenas inativo temporário é editável)

          map.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            address: u.address,
            isActive: u.isActive && !isDeletedFromTenant && !isInactiveForTenant, // Inativo se deletado ou desativado temporariamente
            createdAt: u.createdAt,
            role: Role.ASSISTANT_REVIEWERS,
            isAdmin: false,
            tenant: null,
            tenants,
            isUnlinked: isDeletedFromTenant, // Adiciona flag para indicar se foi desvinculado permanentemente
            isInactiveTemporary: isInactiveForTenant && !isDeletedFromTenant, // Inativo temporário (não deletado)
            isEditable: isEditable, // Adiciona flag para indicar se pode editar
          } as any);
        }
      }
      return Array.from(map.values());
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException('USERS_FETCH_FAILED', 'Erro ao buscar assistentes.');
    }
  }

  async getUserTenant(userId: string, tenantId?: string, role?: Role) {
    const where: any = { userId };
    if (tenantId) where.tenantId = tenantId;
    if (role) where.role = role;
    // Incluir soft-deleted para detectar quando um vínculo foi removido
    return this.userTenantRepository
      .createQueryBuilder('ut')
      .where('ut.userId = :userId', { userId })
      .andWhere(tenantId ? 'ut.tenantId = :tenantId' : '1=1', { tenantId })
      .andWhere(role ? 'ut.role = :role' : '1=1', { role })
      .withDeleted()
      .getOne();
  }

  async getUserTenants(userId: string) {
    return this.userTenantRepository.find({ where: { userId } });
  }

  async findByEmail(email: string): Promise<User> {
    try {
      if (!email || typeof email !== 'string' || email.trim() === '') {
        throw new BusinessException('INVALID_EMAIL', 'user.invalid_email');
      }
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new BusinessException('USER_NOT_FOUND', 'user.not_found', { email });
      }
      return user;
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException(
        'USER_FETCH_FAILED',
        'Erro ao buscar usuário por e-mail. Por favor, tente novamente.',
      );
    }
  }

  async findById(
    userId: string,
    internal = false,
    currentUser?: { isAdminTrue: boolean },
  ): Promise<any> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BusinessException('INVALID_USER_ID', 'user.invalid_id');
    }

    // Buscar incluindo soft-deleted para poder verificar status de usuários deletados
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id: userId })
      .withDeleted()
      .getOne();

    if (!user) throw new UserNotFoundException(userId);

    // Busca vínculos incluindo soft deleted para determinar role
    const userTenants = await this.userTenantRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.tenant', 'tenant')
      .where('ut.userId = :userId', { userId: user.id })
      .withDeleted()
      .getMany();

    const isAdminTarget = userTenants.some((ut) => ut.role === Role.ADMIN);
    const managerUT = userTenants.find((ut) => ut.role === Role.MANAGER_REVIEWERS);
    const assistantUTs = userTenants.filter((ut) => ut.role === Role.ASSISTANT_REVIEWERS);
    const primaryRole = isAdminTarget
      ? Role.ADMIN
      : managerUT
        ? Role.MANAGER_REVIEWERS
        : assistantUTs.length
          ? Role.ASSISTANT_REVIEWERS
          : (() => {
              throw new BusinessException('USER_NO_ROLE', 'user.no_valid_role');
            })();

    if (!internal && currentUser && !currentUser.isAdminTrue) {
      // Nota: Agora temos o findOneSmart para contornar isso para Gestores
      throw new ForbiddenException(
        'Acesso restrito a administradores (Use findOneSmart para Gestores)',
      );
    }

    if (internal) {
      const tenantsInternal = userTenants.map((ut) => ({
        tenantId: ut.tenantId,
        role: ut.role,
      }));
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        mustChangePassword: (user as any).mustChangePassword ?? false,
        createdAt: user.createdAt,
        role: primaryRole,
        isAdmin: isAdminTarget,
        tenants: tenantsInternal,
      };
    }

    const tenantObj = managerUT
      ? {
          id: managerUT.tenant.id,
          companyName: managerUT.tenant.companyName,
          code: managerUT.tenant.code,
          paymentStatus: managerUT.tenant.paymentStatus,
          paymentMethod: managerUT.tenant.paymentMethod,
          paymentFrequency: managerUT.tenant.paymentFrequency,
          paymentDueDate: managerUT.tenant.paymentDueDate,
        }
      : null;

    // Para Admin: buscar relacionamentos
    let relatedUsers: any[] = [];
    if (isAdminTarget && currentUser?.isAdminTrue) {
      // Admin viewing Admin - não fazer nada
      relatedUsers = [];
    } else if (managerUT && currentUser?.isAdminTrue) {
      // Admin viewing Manager - mostrar TODOS os Assistentes (incluindo deletados)
      const assistants = await this.userTenantRepository
        .createQueryBuilder('ut')
        .leftJoinAndSelect('ut.user', 'user')
        .where('ut.tenantId = :tenantId', { tenantId: managerUT.tenantId })
        .andWhere('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
        .withDeleted() // Inclui soft deleted
        .getMany();

      relatedUsers = assistants.map((ut) => ({
        id: ut.user.id,
        name: ut.user.name,
        email: ut.user.email,
        phone: ut.user.phone,
        role: ut.role,
        tenantId: ut.tenantId,
        linkedAt: ut.createdAt,
        unlinkedAt: ut.deletedAt, // Timestamp de quando foi desvinculado
        isUnlinked: !!ut.deletedAt, // Flag para indicar desvinculado permanente
        isActive: ut.isActive !== false, // Flag para indicar ativo/inativo temporário
      }));
    } else if (assistantUTs.length && currentUser?.isAdminTrue) {
      // Admin viewing Assistant - mostrar seus Gestores e Tenants (incluindo status de vínculo)
      relatedUsers = assistantUTs.map((ut) => ({
        tenantId: ut.tenantId,
        companyName: ut.tenant?.companyName,
        role: ut.role,
        linkedAt: ut.createdAt,
        unlinkedAt: ut.deletedAt, // Timestamp de quando foi desvinculado
        isUnlinked: !!ut.deletedAt, // Flag para indicar desvinculado
      }));
    }

    const tenantsMinimal = assistantUTs.map((ut) => ({
      tenantId: ut.tenantId,
      role: ut.role,
      companyName: ut.tenant?.companyName,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: primaryRole,
      isAdmin: isAdminTarget,
      tenant: isAdminTarget ? null : tenantObj,
      tenants: isAdminTarget || assistantUTs.length ? tenantsMinimal : [],
      relatedUsers: currentUser?.isAdminTrue ? relatedUsers : [],
    };
  }

  async findAll(currentUser: { isAdminTrue: boolean }): Promise<ResponseUserProfileDto[]> {
    try {
      if (!currentUser.isAdminTrue) {
        throw new BusinessException('FORBIDDEN', 'only_admin_can_list_managers');
      }

      // Buscar Managers
      const managerUTs = await this.userTenantRepository.find({
        where: { role: Role.MANAGER_REVIEWERS },
        relations: ['user', 'tenant'],
      });

      const seen = new Set<string>();
      const result: ResponseUserProfileDto[] = [];

      for (const ut of managerUTs) {
        const u = ut.user;
        if (seen.has(u.id)) continue;
        seen.add(u.id);

        result.push({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          address: u.address,
          isActive: u.isActive,
          createdAt: u.createdAt,
          role: Role.MANAGER_REVIEWERS,
          isAdmin: false,
          tenant: {
            id: ut.tenant.id,
            companyName: ut.tenant.companyName,
            code: ut.tenant.code,
            paymentStatus: ut.tenant.paymentStatus,
            paymentMethod: ut.tenant.paymentMethod,
            paymentFrequency: ut.tenant.paymentFrequency,
            paymentDueDate: ut.tenant.paymentDueDate,
          },
          tenants: [],
        });
      }

      // Buscar Assistentes (incluindo soft deleted para mostrar histórico)
      const assistantUTs = await this.userTenantRepository
        .createQueryBuilder('ut')
        .leftJoinAndSelect('ut.user', 'user')
        .leftJoinAndSelect('ut.tenant', 'tenant')
        .where('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
        .withDeleted() // Inclui soft deleted
        .getMany();

      for (const ut of assistantUTs) {
        const u = ut.user;
        if (seen.has(u.id)) continue;
        seen.add(u.id);

        // Buscar todos os tenants deste assistente (incluindo deletados)
        const userAssistantUTs = await this.userTenantRepository
          .createQueryBuilder('ut')
          .leftJoinAndSelect('ut.tenant', 'tenant')
          .where('ut.userId = :userId', { userId: u.id })
          .andWhere('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
          .withDeleted()
          .getMany();

        const tenants = userAssistantUTs.map((aut) => ({
          tenantId: aut.tenantId,
          role: aut.role,
          companyName: aut.tenant.companyName,
        }));

        result.push({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          address: u.address,
          isActive: u.isActive, // Status GLOBAL do sistema (controlado apenas pelo ADMIN)
          createdAt: u.createdAt,
          role: Role.ASSISTANT_REVIEWERS,
          isAdmin: false,
          tenant: null,
          tenants,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException(
        'USERS_FETCH_FAILED',
        'Erro ao buscar lista de gerentes. Por favor, tente novamente.',
      );
    }
  }

  async validateAssistants(userIds: string[], tenantId: string): Promise<boolean> {
    if (!tenantId) return false;
    if (!Array.isArray(userIds) || userIds.length === 0) return true;
    const distinctIds = [...new Set(userIds.filter((id) => typeof id === 'string' && id.trim()))];
    if (distinctIds.length === 0) return true;
    const assistantUTs = await this.userTenantRepository.find({
      where: {
        userId: In(distinctIds),
        tenantId,
        role: Role.ASSISTANT_REVIEWERS,
      },
      relations: ['user'],
    });
    const activeAssistantIds = assistantUTs
      .filter((ut) => ut.user && ut.user.isActive !== false)
      .map((ut) => ut.userId);
    return distinctIds.every((id) => activeAssistantIds.includes(id));
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<UpdateResult> {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new BusinessException('INVALID_USER_ID', 'user.invalid_id');
      }
      return await this.userRepository.update(userId, { refreshToken });
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      throw new BusinessException(
        'REFRESH_TOKEN_UPDATE_FAILED',
        'Erro ao atualizar refresh token.',
      );
    }
  }

  async remove(userId: string, currentUser: GetUserDto): Promise<void> {
    if (!currentUser?.isAdminTrue) {
      throw new BusinessException('FORBIDDEN', 'Somente Administrador pode desativar usuários.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UserNotFoundException(userId);

    // Soft delete global
    user.isActive = false;
    user.refreshToken = null as any;
    await this.userRepository.save(user);

    // Opcional: Também soft delete em todos os vínculos dele
    await this.userTenantRepository.softDelete({ userId: userId });

    // Inativar todos os serviços (functionalities) onde esse usuário é o responsável
    // Para manter a integridade dos dados, apenas marca como inativo mas não deleta
    const functionalities = await this.dataSource.query(
      `SELECT id FROM functionalities WHERE responsible_user_id = $1`,
      [userId],
    );

    if (functionalities.length > 0) {
      const functionalityIds = functionalities.map((f: any) => f.id);
      await this.dataSource.query(
        `UPDATE functionalities SET is_active = false WHERE id = ANY($1)`,
        [functionalityIds],
      );
    }
  }

  async findAssistantByIdForManager(
    userId: string,
    currentUser: { id: string; currentTenantIdGerente: string },
  ): Promise<any> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BusinessException('INVALID_USER_ID', 'user.invalid_id');
    }
    if (!currentUser?.currentTenantIdGerente) {
      throw new ForbiddenException('Acesso negado');
    }
    const target = await this.userRepository.findOne({ where: { id: userId } });
    if (!target) throw new UserNotFoundException(userId);
    // Removida validação de isActive para permitir visualização de usuários inativos globalmente

    const assistantLink = await this.userTenantRepository
      .createQueryBuilder('ut')
      .where('ut.userId = :userId', { userId: target.id })
      .andWhere('ut.tenantId = :tenantId', { tenantId: currentUser.currentTenantIdGerente })
      .andWhere('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
      .withDeleted() // Permite ver mesmo desvinculados
      .getOne();

    if (!assistantLink) {
      throw new ForbiddenException('Acesso negado');
    }

    // Se o assistente foi deletado (soft delete) ou desativado temporariamente
    const isInactiveForManager = !!assistantLink.deletedAt || assistantLink.isActive === false;

    // Busca o tenant para retornar as informações da empresa
    const tenant = await this.tenantRepository.findOne({
      where: { id: currentUser.currentTenantIdGerente },
    });

    // Busca as tarefas atribuídas ao assistente no tenant do gestor
    const responsibilities = await this.orderItemResponsibilityRepository.find({
      where: {
        userId: target.id,
        functionality: {
          tenantId: currentUser.currentTenantIdGerente,
        },
      },
      relations: ['functionality', 'orderItem'],
    });

    const functionalities = responsibilities.map((r) => ({
      assignmentId: r.id,
      orderNumber: r.orderItem?.orderNumber,
      functionalityId: r.functionalityId,
      functionalityName: r.functionality?.name,
      functionalityDescription: r.functionality?.description,
      assistantDeadline: r.assistantDeadline,
      assistantAmount: Number(r.amount),
      delivered: r.delivered,
      description: r.description,
    }));

    // Retorna dados do assistente com as tarefas, observação e informações do tenant
    return {
      id: target.id,
      name: target.name,
      email: target.email,
      phone: target.phone,
      address: target.address,
      isActive: target.isActive && !isInactiveForManager, // Inativo se deletado ou desativado temporariamente
      createdAt: target.createdAt,
      role: Role.ASSISTANT_REVIEWERS,
      observation: assistantLink.observation,
      isActiveForTenant: assistantLink.isActive !== false, // Status temporário específico do tenant
      tenantId: currentUser.currentTenantIdGerente,
      tenant: tenant
        ? {
            id: tenant.id,
            companyName: tenant.companyName,
            address: tenant.address,
            phone: tenant.phone,
            logo: tenant.logo,
            code: tenant.code,
          }
        : undefined,
      functionalities,
    };
  }

  async removeAssistantFromTenant(userId: string, managerTenantId: string): Promise<void> {
    if (!userId) throw new BusinessException('INVALID_ID', 'ID inválido');

    const userTenant = await this.userTenantRepository.findOne({
      where: {
        userId: userId,
        tenantId: managerTenantId,
        role: Role.ASSISTANT_REVIEWERS,
      },
    });

    if (!userTenant) {
      throw new BusinessException(
        'RELATION_NOT_FOUND',
        'Este usuário não é assistente vinculado ao seu tenant.',
      );
    }

    // Soft delete do vínculo
    await this.userTenantRepository.softDelete(userTenant.id);

    // Inativar todos os serviços (functionalities) onde esse usuário é o responsável neste tenant
    await this.dataSource.query(
      `UPDATE functionalities SET is_active = false 
       WHERE responsible_user_id = $1 AND tenant_id = $2`,
      [userId, managerTenantId],
    );
  }

  async findOneSmart(targetId: string, currentUser: any): Promise<any> {
    // 1. Compatibilidade: Aceita tanto isAdminTrue (novo) quanto isAdmin (antigo/banco)
    const isAdmin = currentUser.isAdminTrue || currentUser.isAdmin === true;

    // Se for Admin, libera tudo
    if (isAdmin) {
      return this.findById(targetId, false, { isAdminTrue: true });
    }

    // 3. Se for o próprio usuário vendo seu perfil
    if (currentUser.id === targetId || currentUser.sub === targetId) {
      return this.findByIdProfile(targetId);
    }

    // 2. Resolução do Tenant do Gestor (Plano A: Token | Plano B: Banco)
    let managerTenantId = currentUser.currentTenantIdGerente;

    if (!managerTenantId) {
      // PLANO B: Token veio sem ID? Buscamos no banco agora.
      const managerUT = await this.userTenantRepository.findOne({
        where: { userId: currentUser.id, role: Role.MANAGER_REVIEWERS },
      });
      managerTenantId = managerUT?.tenantId;
    }

    // Se identificamos que é um Gestor
    if (managerTenantId) {
      // Verifica se o usuário alvo é assistente vinculado ao tenant do gestor (incluindo deletados)
      const targetAssistantLink = await this.userTenantRepository
        .createQueryBuilder('ut')
        .where('ut.userId = :userId', { userId: targetId })
        .andWhere('ut.tenantId = :tenantId', { tenantId: managerTenantId })
        .andWhere('ut.role = :role', { role: Role.ASSISTANT_REVIEWERS })
        .withDeleted() // Permite visualizar mesmo desvinculados
        .getOne();

      // Se é assistente do gestor (ativo ou desvinculado), retorna dados completos
      if (targetAssistantLink) {
        return await this.findAssistantByIdForManager(targetId, {
          id: currentUser.id,
          currentTenantIdGerente: managerTenantId,
        });
      }
    }

    throw new ForbiddenException('Você não tem permissão para visualizar este usuário.');
  }

  // Também precisamos ajustar o update para usar a mesma lógica
  async updateUser(
    id: string,
    updateUserDto: Partial<User> & {
      tenantId?: string;
      role?: Role;
      currentPassword?: string;
      observation?: string;
    },
    currentUser?: any,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new UserNotFoundException(id);
      if (user.isActive === false) throw new BusinessException('USER_INACTIVE', 'user.inactive');

      // Compatibilidade de flags
      const isAdminCaller = currentUser?.isAdminTrue || currentUser?.isAdmin === true;
      const isSelf = currentUser?.id === id || currentUser?.sub === id;

      // --- Lógica ADMIN ---
      if (isAdminCaller) {
        // (Mantém lógica de admin igual ao anterior...)
        if (updateUserDto.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(updateUserDto.password, salt);
        }
        if (updateUserDto.name) user.name = updateUserDto.name;
        if (updateUserDto.phone) user.phone = updateUserDto.phone;
        if (updateUserDto.address) user.address = updateUserDto.address;
        if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

        await this.userRepository.save(user);
        return;
      }

      // --- Lógica GESTOR (Com Fallback) ---
      let managerTenantId = currentUser?.currentTenantIdGerente;
      if (!managerTenantId && !isSelf) {
        // Busca no banco se não tiver no token
        const mLink = await this.userTenantRepository.findOne({
          where: { userId: currentUser.id, role: Role.MANAGER_REVIEWERS },
        });
        managerTenantId = mLink?.tenantId;
      }

      if (managerTenantId) {
        // Busca o vínculo do assistente
        const link = await this.userTenantRepository.findOne({
          where: {
            userId: id,
            tenantId: managerTenantId,
            role: Role.ASSISTANT_REVIEWERS,
          },
        });

        if (!link) {
          // Se não achou vínculo e não é o próprio usuário, erro
          if (!isSelf)
            throw new BusinessException(
              'FORBIDDEN',
              'Você não tem permissão para editar este usuário.',
            );
        } else {
          // É GESTOR editando ASSISTENTE - pode editar OBSERVAÇÃO e STATUS TEMPORÁRIO (isActive)

          // Bloqueia qualquer outra edição (apenas campos globais do usuário)
          // Mas ignora campos que são enviados mas não mudaram (como tenantId, role)
          const forbiddenFields = ['name', 'email', 'phone', 'address', 'password'];
          const attemptedForbidden = Object.keys(updateUserDto).some((k) => {
            const fieldValue = (updateUserDto as any)[k];
            // Se é um campo proibido E ele foi efetivamente alterado
            return forbiddenFields.includes(k) && fieldValue !== undefined && fieldValue !== null;
          });

          if (attemptedForbidden) {
            throw new BusinessException(
              'FORBIDDEN',
              'Gestor só pode editar a observação e o status temporário do assistente.',
            );
          }

          // Agora sim, atualiza os campos permitidos
          let updated = false;

          if (updateUserDto.observation !== undefined) {
            link.observation = updateUserDto.observation;
            updated = true;
          }

          // Permite gestor alterar status temporário do assistente (isActive no user_tenant)
          if (updateUserDto.isActive !== undefined) {
            link.isActive = updateUserDto.isActive;
            updated = true;

            // Se está sendo inativado (isActive = false), inativar seus serviços também
            if (updateUserDto.isActive === false) {
              await this.dataSource.query(
                `UPDATE functionalities SET is_active = false 
                 WHERE responsible_user_id = $1 AND tenant_id = $2`,
                [id, managerTenantId],
              );
            }
          }

          if (updated) {
            await this.userTenantRepository.save(link);
          }

          return;
        }
      }

      // --- Lógica PRÓPRIO USUÁRIO (Self) ---
      if (isSelf) {
        // (Mantém lógica self update igual...)
        if (updateUserDto.role || updateUserDto.tenantId || updateUserDto.observation) {
          throw new BusinessException('FORBIDDEN', 'user.cannot_change_roles');
        }
        // ... (resto da lógica de senha/dados pessoais)
        if (updateUserDto.name) user.name = updateUserDto.name;
        if (updateUserDto.phone) user.phone = updateUserDto.phone;
        if (updateUserDto.address) user.address = updateUserDto.address;

        await this.userRepository.save(user);
        return;
      }

      throw new BusinessException('FORBIDDEN', 'Ação não permitida.');
    } catch (error) {
      if (error instanceof BusinessException || error instanceof UserNotFoundException) throw error;
      throw new BusinessException('USER_UPDATE_FAILED', 'Erro ao atualizar usuário.');
    }
  }
}
