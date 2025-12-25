import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Functionality } from './entities/functionality.entity';
// legacy entities removed
import { CreateFunctionalityDto } from './dtos/create-functionality.dto';
import { ResponseFunctionalityDto } from './dtos/response-functionality.dto';
import { CreateServiceOrderDto } from './dtos/create-service-order.dto';
import { ServiceOrderResponseDto } from './dtos/service-order-response.dto';
import { ServiceOrderSummaryDto } from './dtos/service-order-summary.dto';
import { AssignmentResponseDto } from './dtos/assignment-response.dto';
// import { User } from '../user/entities/user.entity';
// import { Client } from '../client/entities/client.entity';
import { UserService } from '../user/user.service';
import { BusinessException } from '../../@shared/exception/business.exception';
import { GetUserDto } from '../../@shared/dto/get-user.dto';
// import { Role } from '../../@shared/enums/roles.enum';
import { UpdateFunctionalityDto } from './dtos/update-functionality.dto';
import { FunctionalitiesClientsStatus } from '../../@shared/enums';
import { OrdersService } from '../orders/orders.service';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItemResponsibility } from '../orders/entities/order-item-responsibility.entity';

@Injectable()
export class FunctionalityService {
  constructor(
    @InjectRepository(Functionality)
    private readonly repo: Repository<Functionality>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderItemResponsibility)
    private readonly respRepo: Repository<OrderItemResponsibility>,

    private readonly userService: UserService,
    private readonly ordersService: OrdersService,
  ) {}

  // Asserta que o userId é o responsável válido para a functionality no tenant
  // responsibility assert no longer used in delegated creation flow

  // Listar todos os serviços do tenant do usuário
  async findAll(user: GetUserDto): Promise<ResponseFunctionalityDto[]> {
    try {
      const functionalities = await this.repo.find({
        where: { tenantId: user.currentTenantIdGerente },
        relations: ['tenant'],
      });

      // Mapear e verificar status do usuário responsável
      const result = await Promise.all(
        functionalities.map(async (functionality) => {
          const dto = this.mapToResponseDto(functionality);

          // Se a funcionalidade foi deletada (soft delete), não verifica responsável
          // A inativação é por causa da funcionalidade estar deletada, não do responsável
          if (functionality.deletedAt) {
            return dto;
          }

          // Buscar usuário responsável para verificar seu status
          const responsibleUser = await this.userService.findById(functionality.responsibleUserId);

          if (responsibleUser) {
            // Se o usuário foi deletado (soft delete) ou está inativo globalmente
            if (responsibleUser.deletedAt || !responsibleUser.isActive) {
              dto.isActive = false;
              dto.inactiveReason = responsibleUser.deletedAt
                ? 'RESPONSIBLE_DELETED'
                : 'RESPONSIBLE_INACTIVE';
            } else {
              // Se o usuário está globalmente ativo, verificar status no tenant
              // Verificar se o vínculo user_tenant foi deletado (removido pelo gestor)
              const userTenant = await this.userService.getUserTenant(
                functionality.responsibleUserId,
                functionality.tenantId,
              );

              if (!userTenant || userTenant.deletedAt) {
                // Vínculo foi removido (soft delete)
                dto.isActive = false;
                dto.inactiveReason = 'RESPONSIBLE_DELETED';
              } else if (!userTenant.isActive) {
                // Vínculo existe mas está inativo temporariamente
                dto.isActive = false;
                dto.inactiveReason = 'RESPONSIBLE_TEMPORARILY_INACTIVE';
              }
            }
          }

          return dto;
        }),
      );

      return result;
    } catch (error) {
      throw new BusinessException('FUNCTIONALITY_FETCH_FAILED', 'error.internal_server');
    }
  }

  // Criar um novo serviço conforme regras de negócio
  async create(dto: CreateFunctionalityDto, user: GetUserDto): Promise<ResponseFunctionalityDto> {
    try {
      // Apenas MANAGER_REVIEWER pode criar
      if (user.currentTenantIdGerente === '' || user.isAdminTrue) {
        throw new BusinessException(
          'INSUFFICIENT_PERMISSIONS',
          'functionality.insufficient_permissions',
        );
      }

      // Validar unicidade do nome por tenant (apenas 1 serviço com este nome por tenant)
      const exists = await this.repo.findOne({
        where: {
          tenantId: user.currentTenantIdGerente,
          name: dto.name,
          responsibleUserId: dto.responsibleUserId,
        },
      });
      if (exists) {
        throw new ConflictException('functionality.duplicate_name_in_tenant');
      }

      // Validar minimumPrice > 0
      if (dto.minimumPrice <= 0) {
        throw new BusinessException('INVALID_MINIMUM_PRICE', 'functionality.invalid_minimum_price');
      }

      // Validar defaultAssistantPrice <= minimumPrice
      if (
        dto.defaultAssistantPrice !== undefined &&
        dto.defaultAssistantPrice !== null &&
        dto.defaultAssistantPrice > dto.minimumPrice
      ) {
        throw new BusinessException(
          'INVALID_ASSISTANT_PRICE',
          'functionality.invalid_assistant_price',
        );
      }

      // Criar o Service
      const svc = this.repo.create({
        name: dto.name,
        description: dto.description,
        minimumPrice: dto.minimumPrice,
        defaultAssistantPrice: dto.defaultAssistantPrice,
        status: dto.status ?? 'ACTIVE',
        tenantId: user.currentTenantIdGerente,
        responsibleUserId: dto.responsibleUserId,
      });
      await this.repo.save(svc);
      return this.mapToResponseDto(svc);
    } catch (error: any) {
      // Mapear conflito de índice único do banco (23505) para 409 com mensagem clara
      if (error?.code === '23505') {
        throw new ConflictException('functionality.duplicate_name_in_tenant');
      }
      // Se é uma exceção de negócio, relança
      if (error instanceof BusinessException) {
        throw error;
      }

      // Para outros erros, cria uma exceção de negócio genérica
      throw new BusinessException('FUNCTIONALITY_CREATION_FAILED', 'error.internal_server');
    }
  }

  // Criar uma nova ordem de serviço
  /**
   * @deprecated Use OrdersService.create instead. Maintained for UI compatibility.
   */
  async createServiceOrder(
    dto: CreateServiceOrderDto,
    user: GetUserDto,
  ): Promise<ServiceOrderResponseDto> {
    // Delegate to OrdersService, then map to legacy DTO shape
    if (user.currentTenantIdGerente === '' || user.isAdminTrue) {
      throw new BusinessException(
        'INSUFFICIENT_PERMISSIONS',
        'functionality.insufficient_permissions',
      );
    }
    // Build order payload from legacy DTO
    const order = await this.ordersService.create({
      clientId: dto.clientId,
      description: dto.description,
      contractDate: dto.contractDate,
      paymentMethod: this.normalizePaymentMethod(dto.services?.[0]?.paymentMethod),
      items: dto.services.map((s) => ({
        functionalityId: s.functionalityId,
        price: s.totalPrice,
        clientDeadline: s.clientDeadline,
        itemStatus: this.mapClientStatusToItemStatus(s.status),
      })),
      tenantId: user.currentTenantIdGerente,
    } as any);

    // Fetch full for mapping
    const full = await this.ordersService.findOne(order.id, user.currentTenantIdGerente);
    return this.mapOrderToLegacyResponseFromNew(full);
  }

  // Buscar ordem de serviço por cliente
  async getServiceOrderByClient(
    clientId: string,
    user: GetUserDto,
  ): Promise<ServiceOrderResponseDto> {
    // Delegate: list orders by client and map to legacy response (aggregate by first order)
    const list = await this.ordersService.list(user.currentTenantIdGerente, {
      clientId,
      page: 1,
      pageSize: 100,
    } as any);
    if (!list.data.length)
      throw new NotFoundException('Nenhuma ordem de serviço encontrada para este cliente.');
    // Map the first order (legacy API returns a single aggregate for a client)
    const full = await this.ordersService.findOne(list.data[0].id, user.currentTenantIdGerente);
    return this.mapOrderToLegacyResponseFromNew(full);
  }

  // Listar responsável(veis) habilitado(s) para uma funcionalidade no tenant atual
  async getResponsibles(
    functionalityId: string,
    user: GetUserDto,
  ): Promise<Array<{ id: string; name: string }>> {
    // Apenas MANAGER_REVIEWERS
    if (user.currentTenantIdGerente === '' || user.isAdminTrue) {
      throw new ForbiddenException('functionality.insufficient_permissions');
    }

    const functionality = await this.repo.findOne({ where: { id: functionalityId } });
    if (!functionality || functionality.tenantId !== user.currentTenantIdGerente) {
      throw new NotFoundException('Funcionalidade não encontrada no seu tenant.');
    }

    // Regra atual: responsável único definido na própria funcionalidade
    // Buscar usuário para retornar também o nome
    const userEntity = await this.userService.findById(functionality.responsibleUserId);
    if (!userEntity) {
      return [];
    }
    return [{ id: userEntity.id, name: userEntity.name }];
  }

  // Expor responsável único do serviço com dados completos
  async getResponsible(
    functionalityId: string,
    user: GetUserDto,
  ): Promise<{ userId: string; name: string; email: string }> {
    // Apenas MANAGER_REVIEWERS
    if (user.currentTenantIdGerente === '' || user.isAdminTrue) {
      throw new ForbiddenException('functionality.insufficient_permissions');
    }

    const functionality = await this.repo.findOne({ where: { id: functionalityId } });
    if (!functionality || functionality.tenantId !== user.currentTenantIdGerente) {
      throw new NotFoundException('Funcionalidade não encontrada no seu tenant.');
    }

    const responsible = await this.userService.findById(functionality.responsibleUserId);
    if (!responsible) {
      throw new NotFoundException('Usuário responsável não encontrado.');
    }
    return { userId: responsible.id, name: responsible.name, email: (responsible as any).email };
  }

  // Listar todas as ordens de serviço do tenant (para managers)
  async getAllServiceOrders(
    user: GetUserDto,
    filters?: {
      status?: FunctionalitiesClientsStatus;
      contractDateFrom?: string; // ISO
      contractDateTo?: string; // ISO
      hasOverdueCollaborators?: boolean;
    },
  ): Promise<ServiceOrderResponseDto[]> {
    if (user.currentTenantIdGerente === '' || user.isAdminTrue) {
      throw new ForbiddenException('Apenas MANAGER_REVIEWERS podem listar todas as ordens.');
    }
    // Delegate to OrdersService and map to legacy shape per order
    const q: any = {
      page: 1,
      pageSize: 100,
      from: filters?.contractDateFrom,
      to: filters?.contractDateTo,
    };
    const list = await this.ordersService.list(user.currentTenantIdGerente, q);
    const results: ServiceOrderResponseDto[] = [];
    for (const o of list.data) {
      const full = await this.ordersService.findOne(o.id, user.currentTenantIdGerente);
      results.push(this.mapOrderToLegacyResponseFromNew(full));
    }
    // Optional legacy-style filters
    let filtered = results;
    if (filters?.status) filtered = filtered.filter((s) => s.status === filters.status);
    return filtered;
  }

  // Listar atribuições do usuário logado (assistant ou manager que se auto-atribuiu)
  async getMyAssignments(user: GetUserDto): Promise<AssignmentResponseDto[]> {
    if (user.isAdminTrue) throw new ForbiddenException('Administradores não possuem atribuições.');

    const rows = await this.respRepo
      .createQueryBuilder('r')
      .innerJoin('r.orderItem', 'i')
      .innerJoin('i.order', 'o')
      .leftJoin('i.functionality', 'f')
      .leftJoin('o.client', 'c')
      .where('r.userId = :uid', { uid: user.id })
      .andWhere('o.tenantId = :tenant', { tenant: user.currentTenantIdGerente })
      .select([
        'r.id as "assignmentId"',
        'o.orderNumber as "orderNumber"',
        'c.name as "clientName"',
        `COALESCE(f.name,'Serviço') as "serviceName"`,
        'r.description as "serviceDescription"',
        'r.amount as "yourAmount"',
        'r.assistantDeadline as "yourDeadline"',
        'r.is_delivered as "delivered"',
      ])
      .orderBy('r.assistantDeadline', 'ASC')
      .getRawMany();

    return rows.map((r) => {
      const deadline =
        r.yourDeadline instanceof Date
          ? r.yourDeadline.toISOString().slice(0, 10)
          : (r.yourDeadline as string);
      const overdue = deadline && new Date(deadline) < new Date() && !r.delivered;

      return {
        assignmentId: r.assignmentId,
        orderNumber: r.orderNumber,
        clientName: r.clientName ?? '',
        serviceName: r.serviceName,
        serviceDescription: r.serviceDescription ?? '',
        yourAmount: Number(r.yourAmount),
        yourDeadline: deadline,
        status: r.delivered ? 'FINISHED' : overdue ? 'OVERDUE' : 'IN_PROGRESS',
      } as AssignmentResponseDto;
    });
  }

  // Buscar resumo estatístico das ordens de serviço
  async getServiceOrderSummary(currentUser: GetUserDto): Promise<ServiceOrderSummaryDto> {
    const tenantId = currentUser.currentTenantIdGerente;
    const orders = await this.orderRepo.find({ where: { tenantId } });
    const totalRevenue = orders.reduce((s, o) => s + Number(o.amountTotal), 0);
    const totalServices = await this.orderItemRepo.count({
      where: { orderId: In(orders.map((o) => o.id)) },
    });
    const responsibilities = await this.respRepo
      .createQueryBuilder('r')
      .innerJoin(OrderItem, 'i', 'i.id = r.orderItemId')
      .innerJoin(Order, 'o', 'o.id = i.orderId')
      .where('o.tenantId = :tenant', { tenant: tenantId })
      .select([
        'SUM(r.amount) as total',
        'SUM(CASE WHEN r.is_delivered THEN 1 ELSE 0 END) as delivered',
        'COUNT(*) as cnt',
      ])
      .getRawOne();
    const totalCosts = Number(responsibilities?.total || 0);
    const completedDeliveries = Number(responsibilities?.delivered || 0);
    const pendingDeliveries = Number(responsibilities?.cnt || 0) - completedDeliveries;
    const pendingOrders = orders.filter((o) => (o as any).paymentStatus === 'PENDING').length;
    const paidOrders = orders.filter((o) => (o as any).paymentStatus === 'PAID').length;
    const overdueOrders = orders.filter((o) => (o as any).workStatus === 'OVERDUE').length;
    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCosts,
      totalProfit: totalRevenue - totalCosts,
      pendingOrders,
      paidOrders,
      overdueOrders,
      totalServices,
      pendingDeliveries,
      completedDeliveries,
    };
  }

  // legacy helper removed; delegation now maps from Orders
  private mapToResponseDto(functionality: Functionality): ResponseFunctionalityDto {
    return {
      id: functionality.id,
      name: functionality.name,
      description: functionality.description,
      minimumPrice: functionality.minimumPrice,
      defaultAssistantPrice: functionality.defaultAssistantPrice,
      defaultAssistantId: functionality.defaultAssistantId || undefined,
      status: functionality.status,
      tenantId: functionality.tenantId,
      responsibleUserId: functionality.responsibleUserId,
      isActive: functionality.isActive,
      deletedAt: functionality.deletedAt,
      createdAt: functionality.createdAt,
      updatedAt: functionality.updatedAt,
    };
  }

  // Atualizar funcionalidade pertencente ao tenant do gerente atual
  async update(
    id: string,
    dto: UpdateFunctionalityDto,
    user: GetUserDto,
  ): Promise<ResponseFunctionalityDto> {
    if (!user.currentTenantIdGerente || user.isAdminTrue) {
      throw new ForbiddenException('functionality.insufficient_permissions');
    }

    const functionality = await this.repo.findOne({ where: { id } });
    if (!functionality || functionality.tenantId !== user.currentTenantIdGerente) {
      throw new NotFoundException('Funcionalidade não encontrada no seu tenant.');
    }

    // Atualiza apenas campos editáveis presentes no dto
    if (dto.name !== undefined) functionality.name = dto.name;
    if (dto.description !== undefined) functionality.description = dto.description;
    if (dto.minimumPrice !== undefined) functionality.minimumPrice = dto.minimumPrice;
    if (dto.defaultAssistantPrice !== undefined)
      functionality.defaultAssistantPrice = dto.defaultAssistantPrice;
    if (dto.status !== undefined) functionality.status = dto.status;

    await this.repo.save(functionality);
    return this.mapToResponseDto(functionality);
  }

  // Soft delete: marca deletedAt e mantem registro
  async softDelete(id: string, user: GetUserDto): Promise<void> {
    if (!user.currentTenantIdGerente || user.isAdminTrue) {
      throw new ForbiddenException('functionality.insufficient_permissions');
    }

    const functionality = await this.repo.findOne({ where: { id } });
    if (!functionality || functionality.tenantId !== user.currentTenantIdGerente) {
      throw new NotFoundException('Funcionalidade não encontrada no seu tenant.');
    }

    //functionality.deletedAt = new Date();
    functionality.isActive = false;
    functionality.status = 'INACTIVE';
    await this.repo.save(functionality);
  }

  //private methods

  //private method to format ISO date
  private formatIsoDateOnly(d: Date | string | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toISOString().split('T')[0];
  }

  //private method to map order response from new format to legacy format
  private mapOrderToLegacyResponseFromNew(resp: any): ServiceOrderResponseDto {
    const minDeadline = resp.items.length
      ? new Date(Math.min(...resp.items.map((i: any) => new Date(i.clientDeadline).getTime())))
      : new Date(resp.contractDate);
    const status =
      resp.paymentStatus === 'PAID'
        ? FunctionalitiesClientsStatus.COMPLETED
        : FunctionalitiesClientsStatus.PENDING_PAYMENT;
    return {
      orderId: resp.id,
      orderNumber: resp.orderNumber,
      clientId: resp.client.id,
      clientName: '',
      clientEmail: '',
      deadline: this.formatIsoDateOnly(minDeadline),
      total: Number(resp.amountTotal),
      totalAssistantAmount: 0,
      serviceCount: resp.items.length,
      status,
      services: resp.items.map((it: any) => ({
        id: it.id,
        orderNumber: resp.orderNumber,
        orderDescription: resp.description || undefined,
        contractDate: new Date(resp.contractDate),
        functionalityId: it.functionality.id,
        functionalityName: it.functionality.name || '',
        totalPrice: Number(it.price),
        paymentMethod: resp.paymentMethod,
        clientDeadline: this.formatIsoDateOnly(it.clientDeadline),
        status: FunctionalitiesClientsStatus.IN_PROGRESS,
        createdAt: new Date(resp.contractDate),
      })) as any,
      createdAt: new Date(resp.contractDate),
    } as ServiceOrderResponseDto;
  }

  //private method to normalize payment method
  private normalizePaymentMethod(
    _pm: string | undefined,
  ): 'pix' | 'transfer' | 'deposit' | 'card' | 'other' {
    const v = (_pm || 'pix').toLowerCase();
    if (v.includes('pix')) return 'pix';
    if (v.includes('transfer')) return 'transfer';
    if (v.includes('deposit') || v.includes('depósito') || v.includes('deposito')) return 'deposit';
    if (v.includes('card') || v.includes('cartao') || v.includes('cartão')) return 'card';
    return 'other';
  }

  //private method to map client status to item status
  private mapClientStatusToItemStatus(s: FunctionalitiesClientsStatus) {
    switch (s) {
      case FunctionalitiesClientsStatus.IN_PROGRESS:
        return 'IN_PROGRESS';
      case FunctionalitiesClientsStatus.OVERDUE:
        return 'OVERDUE';
      case FunctionalitiesClientsStatus.COMPLETED:
        return 'FINISHED';
      default:
        return 'PENDING';
    }
  }
}
