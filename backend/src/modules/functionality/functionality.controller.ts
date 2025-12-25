import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { FunctionalityService } from './functionality.service';
import { CreateFunctionalityDto } from './dtos/create-functionality.dto';
import { CreateServiceOrderDto } from './dtos/create-service-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../@shared/guards/roles.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseFunctionalityDto } from './dtos/response-functionality.dto';
import { ServiceOrderResponseDto } from './dtos/service-order-response.dto';
import { ServiceOrderSummaryDto } from './dtos/service-order-summary.dto';
import { Roles } from '../../@shared/decorator/roles.decorator';
import { Role } from '../../@shared/enums/roles.enum';
import { GetUserDto } from '../../@shared/dto/get-user.dto';
import { GetUser } from '../../@shared/decorator/get-user.decorator';
import { UpdateFunctionalityDto } from './dtos/update-functionality.dto';

@Controller('functionalities')
@ApiTags('Functionalities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FunctionalityController {
  constructor(private readonly functionalityService: FunctionalityService) {}

  @Post()
  @Roles(Role.MANAGER_REVIEWERS)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateFunctionalityDto,
    @GetUser() currentUser: GetUserDto,
  ): Promise<ResponseFunctionalityDto> {
    return this.functionalityService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.MANAGER_REVIEWERS)
  async findAll(@GetUser() currentUser: GetUserDto): Promise<ResponseFunctionalityDto[]> {
    return this.functionalityService.findAll(currentUser);
  }

  @Post('service-order')
  @Roles(Role.MANAGER_REVIEWERS)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  async createServiceOrder(
    @Body() dto: CreateServiceOrderDto,
    @GetUser() currentUser: GetUserDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.functionalityService.createServiceOrder(dto, currentUser);
  }

  @Get(':id/responsibles')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Listar responsável(veis) habilitado(s) para a funcionalidade' })
  async getResponsibles(
    @Param('id') id: string,
    @GetUser() currentUser: GetUserDto,
  ): Promise<Array<{ id: string; name: string }>> {
    return this.functionalityService.getResponsibles(id, currentUser);
  }

  @Get(':id/responsible')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Obter o responsável do serviço (id, nome, email)' })
  async getResponsible(
    @Param('id') id: string,
    @GetUser() currentUser: GetUserDto,
  ): Promise<{ userId: string; name: string; email: string }> {
    return this.functionalityService.getResponsible(id, currentUser);
  }

  @Get('service-order/summary')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Obter resumo estatístico das ordens de serviço' })
  async getServiceOrderSummary(
    @GetUser() currentUser: GetUserDto,
  ): Promise<ServiceOrderSummaryDto> {
    return this.functionalityService.getServiceOrderSummary(currentUser);
  }

  @Get('service-order')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Listar todas as ordens de serviço do tenant' })
  async getAllServiceOrders(
    @GetUser() currentUser: GetUserDto,
    @Query('status') status?: string,
    @Query('contractDateFrom') contractDateFrom?: string,
    @Query('contractDateTo') contractDateTo?: string,
    @Query('hasOverdueCollaborators') hasOverdueCollaborators?: string,
  ): Promise<ServiceOrderResponseDto[]> {
    // Mapear query params simples para o objeto de filtros do service
    const filters: any = {};
    if (status) filters.status = status;
    if (contractDateFrom) filters.contractDateFrom = contractDateFrom;
    if (contractDateTo) filters.contractDateTo = contractDateTo;
    if (typeof hasOverdueCollaborators !== 'undefined') {
      filters.hasOverdueCollaborators = ['true', '1', 'yes'].includes(
        String(hasOverdueCollaborators).toLowerCase(),
      );
    }
    return this.functionalityService.getAllServiceOrders(currentUser, filters);
  }

  @Get('service-order/my-assignments')
  @Roles(Role.ASSISTANT_REVIEWERS)
  @ApiOperation({ summary: 'Listar atribuições do assistant logado' })
  async getMyAssignments(@GetUser() currentUser: GetUserDto): Promise<any[]> {
    return this.functionalityService.getMyAssignments(currentUser);
  }

  @Get('service-order/client/:clientId')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Buscar ordem de serviço por cliente' })
  async getServiceOrderByClient(
    @Param('clientId') clientId: string,
    @GetUser() currentUser: GetUserDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.functionalityService.getServiceOrderByClient(clientId, currentUser);
  }

  @Put(':id')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Atualizar uma funcionalidade' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFunctionalityDto,
    @GetUser() currentUser: GetUserDto,
  ): Promise<ResponseFunctionalityDto> {
    return this.functionalityService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.MANAGER_REVIEWERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar (soft delete) uma funcionalidade' })
  async softDelete(@Param('id') id: string, @GetUser() currentUser: GetUserDto): Promise<void> {
    await this.functionalityService.softDelete(id, currentUser);
  }
}
