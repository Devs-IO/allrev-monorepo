import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  AddOrderItemDto,
  CreateOrderDto,
  PayInstallmentDto,
  UpdateInstallmentsDto,
} from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { GetUser } from '../../@shared/decorator/get-user.decorator';
import type { GetUserDto } from '../../@shared/dto/get-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../@shared/guards/roles.guard';
import { Roles } from '../../@shared/decorator/roles.decorator';
import { Role } from '../../@shared/enums/roles.enum';
import { OrderItemStatus } from './entities/order-item.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS)
  async create(@Body() dto: CreateOrderDto, @GetUser() user: GetUserDto) {
    if (!user.currentTenantIdGerente) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.create({ ...dto, tenantId: user.currentTenantIdGerente });
  }

  // --- ADMIN DASHBOARD ---
  @Get('dashboard/admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminDashboard() {
    return this.orders.getAdminDashboardSummary();
  }

  // --- DASHBOARD SUMMARY (Gestor/Assistente) ---
  @Get('dashboard/summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS)
  async getDashboardSummary(@GetUser() user: GetUserDto) {
    // Admin não deveria acessar este endpoint (use /dashboard/admin)
    // Mas se entrar, filtra por seu primeiro tenant
    const tenantId =
      user.role === Role.ADMIN
        ? undefined
        : user.currentTenantIdGerente || user.currentTenantIdAssistentes?.[0];

    if (!tenantId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Usuário não possui vínculo com nenhum tenant válido.');
    }

    const viewAsUserId = user.role === Role.ASSISTANT_REVIEWERS ? user.id : undefined;

    return this.orders.getDashboardSummary(tenantId, viewAsUserId);
  }

  // --- LISTAGEM DO CLIENTE (PORTAL) ---
  @Get('portal/my')
  @UseGuards(AuthGuard('jwt-client'))
  async listMy(@Query('page') page: number, @Query('pageSize') pageSize: number, @Req() req: any) {
    const email = req.user?.email;
    return this.orders.listForClient(email, Number(page), Number(pageSize));
  }

  // --- LISTAGEM SEGURA ---
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS)
  async list(@Query() q: ListOrdersQueryDto, @GetUser() user: GetUserDto) {
    // 1. Definição do Tenant ID (Prioriza Gerente, fallback para Assistente)
    const tenantId = user.currentTenantIdGerente || user.currentTenantIdAssistentes?.[0];

    if (!tenantId) {
      throw new ForbiddenException('Usuário não possui vínculo com nenhum tenant válido.');
    }

    // 2. Definição do Modo de Visualização (Sanitização)
    let viewAsUserId: string | undefined;

    // Se for Assistente, ativamos o modo restrito
    if (user.role === Role.ASSISTANT_REVIEWERS) {
      q.responsibleId = user.id; // Força o filtro na busca (Query do Banco)
      viewAsUserId = user.id; // Força a limpeza no retorno (Sanitização)
    }

    return this.orders.list(tenantId, q, viewAsUserId);
  }

  // --- DETALHE SEGURO ---
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS)
  async get(@Param('id') id: string, @GetUser() user: GetUserDto) {
    const tenantId = user.currentTenantIdGerente || user.currentTenantIdAssistentes?.[0];

    if (!tenantId) {
      throw new ForbiddenException('Usuário não possui vínculo com nenhum tenant válido.');
    }

    // Se for assistente, passamos o ID dele para filtrar os itens internos da ordem
    const viewAsUserId = user.role === Role.ASSISTANT_REVIEWERS ? user.id : undefined;

    return this.orders.findOne(id, tenantId, viewAsUserId);
  }

  @Post(':id/items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS)
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddOrderItemDto,
    @GetUser() user: GetUserDto,
  ) {
    if (!user.currentTenantIdGerente) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.addItem(id, dto, user.currentTenantIdGerente);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS)
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @GetUser() user: GetUserDto,
  ) {
    if (!user.currentTenantIdGerente) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.removeItem(id, itemId, user.currentTenantIdGerente);
  }

  @Patch(':id/installments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS)
  async updateInstallments(
    @Param('id') id: string,
    @Body() body: UpdateInstallmentsDto,
    @GetUser() user: GetUserDto,
  ) {
    if (!user.currentTenantIdGerente) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.updateUnpaidInstallments(id, body, user.currentTenantIdGerente);
  }

  @Patch(':id/installments/:instId/pay')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS)
  async payInstallment(
    @Param('id') id: string,
    @Param('instId') instId: string,
    @Body() body: PayInstallmentDto,
    @GetUser() user: GetUserDto,
  ) {
    if (!user.currentTenantIdGerente) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.payInstallment(id, instId, body, user.currentTenantIdGerente);
  }

  @Patch(':id/items/:itemId/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS)
  async updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: OrderItemStatus,
    @GetUser() user: GetUserDto,
  ) {
    if (!user.currentTenantIdGerente && !user.currentTenantIdAssistentes?.length) {
      throw new ForbiddenException('Tenant do gerente inválido.');
    }
    return this.orders.updateItemStatus(
      orderId,
      itemId,
      status,
      user.currentTenantIdGerente || user.currentTenantIdAssistentes?.[0]!,
    );
  }
}
