import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository, LessThan } from 'typeorm';
import {
  Order,
  OrderPaymentStatus,
  OrderWorkStatus,
  OrderPaymentTerms,
} from './entities/order.entity';
import { OrderItem, OrderItemStatus } from './entities/order-item.entity';
import { OrderInstallment } from './entities/order-installment.entity';
import { OrderItemResponsibility } from './entities/order-item-responsibility.entity';
import {
  AddOrderItemDto,
  CreateOrderDto,
  PayInstallmentDto,
  UpdateInstallmentsDto,
} from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { Client } from '../client/entities/client.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderInstallment)
    private readonly instRepo: Repository<OrderInstallment>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Inicialização opcional (contadores, seeds, etc)
  }

  private ensureValidTenant(tenantId?: string) {
    // Basic UUID v4/v1 format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!tenantId || !uuidRegex.test(tenantId)) {
      throw new BadRequestException('tenantId inválido ou ausente');
    }
  }

  // --- DASHBOARD SUMMARY (para Gestor e Assistente) ---
  async getDashboardSummary(tenantId?: string, viewAsUserId?: string) {
    // Gestor e Assistente devem ter tenantId
    if (tenantId) {
      this.ensureValidTenant(tenantId);
    }

    // ========== DADOS FINANCEIROS ==========
    // Receita Total (todas as ordens confirmadas)
    const revenueQb = this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.amountTotal)', 'total')
      .where('o.tenantId = :tenantId', { tenantId });

    if (viewAsUserId) {
      revenueQb
        .leftJoin('o.items', 'item')
        .leftJoin('item.responsibilities', 'resp')
        .andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const totalRevenue = await revenueQb.getRawOne();

    // Custo Operacional (soma de responsabilities)
    const costQb = this.dataSource
      .createQueryBuilder()
      .select('SUM(resp.amount)', 'total')
      .from(OrderItemResponsibility, 'resp')
      .leftJoin(OrderItem, 'item', 'item.id = resp.orderItemId')
      .leftJoin(Order, 'o', 'o.id = item.orderId')
      .where('o.tenantId = :tenantId', { tenantId });

    if (viewAsUserId) {
      costQb.andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const totalCost = await costQb.getRawOne();

    const revenue = parseFloat(totalRevenue?.total) || 0;
    const cost = parseFloat(totalCost?.total) || 0;
    const netProfit = revenue - cost;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // ========== ORDENS ATRASADAS ==========
    const overdueQb = this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(DISTINCT o.id)', 'count')
      .leftJoin('o.items', 'item')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.workStatus != :completed', { completed: OrderWorkStatus.COMPLETED })
      // Atraso baseado no prazo do cliente em cada item
      .andWhere('item.clientDeadline < NOW()')
      .andWhere('item.itemStatus != :canceled', { canceled: OrderItemStatus.CANCELLED });

    if (viewAsUserId) {
      overdueQb
        .leftJoin('item.responsibilities', 'resp')
        .andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const overdueOrders = await overdueQb.getRawOne();
    const overdueCount = parseInt(overdueOrders?.count) || 0;

    // ========== DADOS POR STATUS ==========
    // Ordens por status de pagamento
    const paymentQb = this.orderRepo
      .createQueryBuilder('o')
      .select('o.paymentStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(o.amountTotal)', 'total')
      .where('o.tenantId = :tenantId', { tenantId });

    if (viewAsUserId) {
      paymentQb
        .leftJoin('o.items', 'item')
        .leftJoin('item.responsibilities', 'resp')
        .andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const paymentStats = await paymentQb.groupBy('o.paymentStatus').getRawMany();

    // Ordens por status de trabalho
    const workQb = this.orderRepo
      .createQueryBuilder('o')
      .select('o.workStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.tenantId = :tenantId', { tenantId });

    if (viewAsUserId) {
      workQb
        .leftJoin('o.items', 'item')
        .leftJoin('item.responsibilities', 'resp')
        .andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const workStats = await workQb.groupBy('o.workStatus').getRawMany();

    // ========== CONTAGEM GERAL ==========
    const totalOrdersQb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId });

    if (viewAsUserId) {
      totalOrdersQb
        .leftJoin('o.items', 'item')
        .leftJoin('item.responsibilities', 'resp')
        .andWhere('resp.userId = :userId', { userId: viewAsUserId });
    }

    const totalOrders = await totalOrdersQb.getCount();

    return {
      totalOrders,
      revenue,
      cost,
      netProfit,
      margin,
      overdueItemsCount: overdueCount,
      paymentStats: paymentStats.map((s) => ({
        status: s.status,
        count: parseInt(s.count),
        total: parseFloat(s.total) || 0,
      })),
      workStats: workStats.map((s) => ({
        status: s.status,
        count: parseInt(s.count),
      })),
    };
  }

  // --- ADMIN DASHBOARD SUMMARY (visão geral do SaaS) ---
  async getAdminDashboardSummary() {
    const tenantRepo = this.dataSource.getRepository(Tenant);
    const userRepo = this.dataSource.getRepository(User);
    const instRepo = this.instRepo;

    const activeTenants = await tenantRepo.count({
      where: { deletedAt: IsNull(), isActive: true },
    });
    const activeUsers = await userRepo.count({ where: { deletedAt: IsNull(), isActive: true } });

    // Parcelas vencidas e não pagas (qualquer tenant)
    const overduePayments = await instRepo.count({
      where: {
        paidAt: IsNull(),
        // dueDate é coluna date, TypeORM espera string; usamos ISO yyyy-mm-dd
        dueDate: LessThan(new Date().toISOString().slice(0, 10)),
      },
    });

    return {
      activeTenants,
      totalUsers: activeUsers,
      overduePayments,
    };
  }

  // --- 1. LISTAGEM OTIMIZADA E SEGURA ---
  async list(tenantId: string, q: ListOrdersQueryDto, viewAsUserId?: string) {
    this.ensureValidTenant(tenantId);
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.pageSize) || 20));

    // Inicia Query leve (apenas IDs e campo de ordenação)
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select(['o.id', 'o.contractDate'])
      .where('o.tenantId = :tenantId', { tenantId });

    // --- FILTRO DE SEGURANÇA (Inner Join) ---
    // Se viewAsUserId estiver presente, usamos o filtro dele para garantir blindagem
    const filterUserId = viewAsUserId || q.responsibleId;

    if (filterUserId) {
      // INNER JOIN obriga que a ordem tenha vínculo com o usuário
      qb.innerJoin('o.items', 'item');
      qb.innerJoin('item.responsibilities', 'resp');
      qb.andWhere('resp.userId = :respId', { respId: filterUserId });
    } else if (q.functionalityId) {
      qb.innerJoin('o.items', 'item');
      qb.andWhere('item.functionalityId = :funcId', { funcId: q.functionalityId });
    }

    // Filtros Padrão
    if (q.paymentStatus) qb.andWhere('o.paymentStatus = :ps', { ps: q.paymentStatus });
    if (q.workStatus) qb.andWhere('o.workStatus = :ws', { ws: q.workStatus });
    if (q.clientId) qb.andWhere('o.clientId = :cid', { cid: q.clientId });
    if (q.from && q.to) {
      qb.andWhere('o.contractDate BETWEEN :from AND :to', {
        from: new Date(q.from),
        to: new Date(q.to),
      });
    }

    // Ordenação, Distinct e Paginação
    qb.orderBy('o.contractDate', 'DESC');
    qb.distinct(true); // Evita duplicatas se user tiver 2 itens na mesma ordem
    qb.skip((page - 1) * limit).take(limit);

    // Executa a Query Leve
    const [rows, total] = await qb.getManyAndCount();

    // Hidratação (Carrega dados completos apenas da página atual)
    // Passamos o viewAsUserId para aplicar a sanitização no detalhe
    const data = await Promise.all(rows.map((o) => this.findOne(o.id, tenantId, viewAsUserId)));

    return { data, total, page, limit };
  }

  // --- 2. BUSCA INDIVIDUAL COM SANITIZAÇÃO ---
  async findOne(id: string, tenantId: string, viewAsUserId?: string) {
    this.ensureValidTenant(tenantId);
    const order = await this.orderRepo.findOne({
      where: { id, tenantId },
      relations: [
        'client',
        'items',
        'items.functionality',
        'items.responsibilities',
        'items.responsibilities.user',
        'installments',
      ],
      order: {
        items: { createdAt: 'ASC' },
        installments: { sequence: 'ASC' },
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem não encontrada');
    }

    // --- LÓGICA DE SANITIZAÇÃO (Se for Assistente) ---
    if (viewAsUserId) {
      // A. Remove itens que não são dele
      order.items = order.items.filter((item) =>
        item.responsibilities?.some((resp) => resp.userId === viewAsUserId),
      );

      // Se não sobrou nada, ele não tem acesso
      if (order.items.length === 0) {
        throw new NotFoundException('Acesso negado a esta ordem.');
      }

      // B. Zera valores globais e do cliente
      order.amountTotal = 0;
      order.amountPaid = 0;
      order.installments = []; // Não vê pagamentos do cliente
      order.items.forEach((item) => {
        item.price = 0; // Não vê quanto o cliente paga
      });
    }
    // ------------------------------------------------

    return this.mapToResponseDto(order);
  }

  // --- LISTAGEM PARA CLIENTE (por e-mail) ---
  async listForClient(email: string, page = 1, limit = 20) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    // Busca todos os IDs de clientes com este e-mail (multi-tenant)
    const clients = await this.dataSource.getRepository(Client).find({
      where: { email },
      select: ['id'],
      withDeleted: false,
    });
    const clientIds = clients.map((c) => c.id);

    if (clientIds.length === 0) {
      return { data: [], total: 0, page: pageNum, limit: pageSize };
    }

    // Busca IDs de ordens do cliente
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select(['o.id'])
      .where('o.clientId IN (:...ids)', { ids: clientIds })
      .orderBy('o.contractDate', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    // Carrega detalhes das ordens garantindo que pertencem aos clientIds
    const orders = await this.orderRepo.find({
      where: { id: In(rows.map((r) => r.id)), clientId: In(clientIds) },
      relations: [
        'client',
        'items',
        'items.functionality',
        'items.responsibilities',
        'items.responsibilities.user',
        'installments',
      ],
      order: {
        items: { createdAt: 'ASC' },
        installments: { sequence: 'ASC' },
      },
    });

    // Mapeia para DTO de resposta (sem sanitização para cliente)
    const data = orders.map((o) => this.mapToResponseDto(o));

    return { data, total, page: pageNum, limit: pageSize };
  }

  // --- 3. CRIAÇÃO (Sem alterações lógicas profundas, apenas garantia de Transaction) ---
  async create(dto: CreateOrderDto & { tenantId: string }): Promise<Order> {
    this.ensureValidTenant(dto.tenantId);
    let orderId: string;

    await this.dataSource.transaction(async (trx) => {
      // Gera número da ordem
      const prefix = new Date(dto.contractDate).toISOString().slice(0, 10).replace(/-/g, '');
      const count = await trx.count(Order, { where: { tenantId: dto.tenantId } });
      const orderNumber = `ORD-${prefix}-${(count + 1).toString().padStart(3, '0')}`;

      // Cria Ordem
      const order = new Order();
      order.tenantId = dto.tenantId;
      order.clientId = dto.clientId!;
      order.orderNumber = orderNumber;
      order.contractDate = new Date(dto.contractDate!);
      order.description = dto.description;
      order.paymentMethod = dto.paymentMethod!;
      order.paymentTerms = dto.paymentTerms || OrderPaymentTerms.ONE; // Default ONE se não informado
      order.paymentStatus = OrderPaymentStatus.PENDING;
      order.workStatus = OrderWorkStatus.PENDING;
      order.amountTotal = 0; // Será recalculado

      const savedOrder = await trx.save(Order, order);
      orderId = savedOrder.id;

      // Processa Itens
      let totalAmount = 0;
      for (const itemDto of dto.items) {
        const item = new OrderItem();
        item.order = savedOrder;
        item.clientId = dto.clientId!;
        item.functionalityId = itemDto.functionalityId;
        item.price = itemDto.price;
        item.clientDeadline = new Date(itemDto.clientDeadline);
        item.itemStatus = OrderItemStatus.PENDING;
        // Campos de redundância
        item.contractDate = savedOrder.contractDate;
        item.orderNumber = orderNumber;

        const savedItem = await trx.save(OrderItem, item);
        totalAmount += Number(item.price);

        // Responsável (Se houver)
        if (itemDto.responsibleUserId) {
          const resp = new OrderItemResponsibility();
          resp.orderItem = savedItem;
          resp.userId = itemDto.responsibleUserId;
          resp.functionalityId = itemDto.functionalityId;
          resp.assistantDeadline = new Date(itemDto.assistantDeadline!);
          resp.amount = itemDto.assistantAmount || 0;
          await trx.save(OrderItemResponsibility, resp);
        }
      }

      // Atualiza Total da Ordem
      savedOrder.amountTotal = totalAmount;
      await trx.save(Order, savedOrder);

      // Processa Parcelas
      if (dto.installments && dto.installments.length > 0) {
        const installments = dto.installments.map((inst, idx) => {
          const newInst = new OrderInstallment();
          newInst.order = savedOrder;
          newInst.sequence = idx + 1;
          newInst.amount = inst.amount;
          newInst.dueDate = inst.dueDate;
          newInst.channel = inst.channel;
          // Redundância para performance
          newInst.orderNumber = orderNumber;
          return newInst;
        });
        await trx.save(OrderInstallment, installments);
      }
    });

    // Busca a ordem fora da transaction para evitar isolamento
    return this.findOne(orderId!, dto.tenantId);
  }

  // --- OUTROS MÉTODOS DE MANUTENÇÃO ---

  async addItem(orderId: string, dto: AddOrderItemDto, tenantId: string) {
    this.ensureValidTenant(tenantId);
    return this.dataSource.transaction(async (trx) => {
      const order = await trx.findOne(Order, { where: { id: orderId, tenantId } });
      if (!order) throw new NotFoundException('Ordem não encontrada');

      const item = new OrderItem();
      item.order = order;
      item.clientId = order.clientId;
      item.functionalityId = dto.functionalityId;
      item.price = dto.price;
      item.clientDeadline = new Date(dto.clientDeadline);
      item.itemStatus = OrderItemStatus.PENDING;
      item.contractDate = order.contractDate;
      item.orderNumber = order.orderNumber;

      const savedItem = await trx.save(OrderItem, item);

      if (dto.responsibleUserId) {
        const resp = new OrderItemResponsibility();
        resp.orderItem = savedItem;
        resp.userId = dto.responsibleUserId;
        resp.functionalityId = dto.functionalityId;
        resp.assistantDeadline = new Date(dto.assistantDeadline!);
        resp.amount = dto.assistantAmount || 0;
        await trx.save(OrderItemResponsibility, resp);
      }

      // Recalcula total da ordem
      order.amountTotal = Number(order.amountTotal) + Number(dto.price);
      await trx.save(Order, order);

      return this.findOne(orderId, tenantId);
    });
  }

  async removeItem(orderId: string, itemId: string, tenantId: string) {
    this.ensureValidTenant(tenantId);
    return this.dataSource.transaction(async (trx) => {
      const item = await trx.findOne(OrderItem, {
        where: { id: itemId, orderId },
        relations: ['order'],
      });
      if (!item || item.order?.tenantId !== tenantId)
        throw new NotFoundException('Item não encontrado');

      const price = Number(item.price);
      const order = item.order!;

      // Remove responsabilidades em cascata (se não tiver cascade configurado)
      await trx.delete(OrderItemResponsibility, { orderItemId: itemId });
      await trx.remove(OrderItem, item);

      order.amountTotal = Number(order.amountTotal) - price;
      await trx.save(Order, order);

      return this.findOne(orderId, tenantId);
    });
  }

  async updateUnpaidInstallments(orderId: string, dto: UpdateInstallmentsDto, tenantId: string) {
    this.ensureValidTenant(tenantId);
    return this.dataSource.transaction(async (trx) => {
      const order = await trx.findOne(Order, { where: { id: orderId, tenantId } });
      if (!order) throw new NotFoundException('Ordem não encontrada');

      // Atualiza as parcelas enviadas
      for (const update of dto.installments) {
        await trx.update(
          OrderInstallment,
          { id: update.id, orderId, paidAt: null }, // Só atualiza se não estiver paga
          { amount: update.amount, dueDate: update.dueDate },
        );
      }
      return this.findOne(orderId, tenantId);
    });
  }

  async payInstallment(orderId: string, instId: string, dto: PayInstallmentDto, tenantId: string) {
    this.ensureValidTenant(tenantId);
    if (!dto.paidAt) {
      throw new BadRequestException('paidAt is required');
    }
    const paidAtDate = new Date(dto.paidAt);
    if (isNaN(paidAtDate.getTime())) {
      throw new BadRequestException('paidAt is not a valid date');
    }

    await this.instRepo.update({ id: instId, orderId }, { paidAt: paidAtDate });

    // Atualiza status da ordem (simplificado)
    const unpaidCount = await this.instRepo.count({ where: { orderId, paidAt: IsNull() } });
    const orderStatus =
      unpaidCount === 0 ? OrderPaymentStatus.PAID : OrderPaymentStatus.PARTIALLY_PAID;

    await this.orderRepo.update({ id: orderId }, { paymentStatus: orderStatus });

    return this.findOne(orderId, tenantId);
  }

  async updateItemStatus(orderId: string, itemId: string, status: any, tenantId: string) {
    this.ensureValidTenant(tenantId);
    await this.itemRepo.update({ id: itemId, orderId }, { itemStatus: status });
    return this.findOne(orderId, tenantId);
  }

  // --- DTO MAPPER (Inteligente) ---
  private mapToResponseDto(order: Order): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      client: {
        ...order.client,
        // Garante que note e description do cliente estejam presentes
        note: order.client?.note || null,
        description: order.client?.description || null,
      },
      contractDate: order.contractDate,
      description: order.description,
      paymentMethod: order.paymentMethod,
      paymentTerms: order.paymentTerms,
      paymentStatus: order.paymentStatus,
      amountTotal: Number(order.amountTotal),
      amountPaid: Number(order.amountPaid),
      workStatus: order.workStatus,
      installments: order.installments,
      items: order.items.map((item) => {
        // Pega o responsável principal
        const mainResp = item.responsibilities?.[0];
        return {
          id: item.id,
          functionality: item.functionality,
          price: Number(item.price),
          clientDeadline: item.clientDeadline,
          itemStatus: item.itemStatus,
          responsible: mainResp
            ? {
                userId: mainResp.userId,
                name: mainResp.user?.name,
                assistantDeadline: mainResp.assistantDeadline,
                amount: Number(mainResp.amount),
              }
            : null,
        };
      }),
    };
  }
}
