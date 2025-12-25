import { Controller, Post, Get, Body, Delete, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { GetUser } from '../../@shared/decorator/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../@shared/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUserDto } from '../../@shared/dto/get-user.dto';
import { BusinessException } from '../../@shared/exception/business.exception';
import { Roles } from '../../@shared/decorator/roles.decorator';
import { Role } from '../../@shared/enums/roles.enum';

@Controller('clients')
@ApiTags('Client')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(Role.MANAGER_REVIEWERS)
  create(@GetUser() user: GetUserDto, @Body() createClientDto: CreateClientDto) {
    if (!user.currentTenantIdGerente) {
      throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
    }
    return this.clientService.create(
      { ...createClientDto, tenantId: user.currentTenantIdGerente },
      user,
    );
  }

  @Get()
  @Roles(Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS) // <--- Assistente pode listar
  findAll(@GetUser() user: GetUserDto) {
    // Determina qual tenant usar
    const tenantId = this.resolveTenantId(user);
    return this.clientService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS) // <--- Assistente pode ver detalhes
  findOne(@GetUser() user: GetUserDto, @Param('id', new ParseUUIDPipe()) id: string) {
    const tenantId = this.resolveTenantId(user);
    return this.clientService.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles(Role.MANAGER_REVIEWERS) // Apenas Gestor edita
  update(
    @GetUser() user: GetUserDto,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    if (!user.currentTenantIdGerente) {
      throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
    }
    return this.clientService.update(id, { ...updateClientDto }, user.currentTenantIdGerente, user);
  }

  @Delete(':id')
  @Roles(Role.MANAGER_REVIEWERS) // Apenas Gestor deleta
  remove(@GetUser() user: GetUserDto, @Param('id', new ParseUUIDPipe()) id: string) {
    if (!user.currentTenantIdGerente) {
      throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
    }
    return this.clientService.remove(id, user.currentTenantIdGerente);
  }

  @Post(':id/send-password')
  @Roles(Role.MANAGER_REVIEWERS)
  resendPassword(@GetUser() user: GetUserDto, @Param('id', new ParseUUIDPipe()) id: string) {
    if (!user.currentTenantIdGerente) {
      throw new BusinessException('INSUFFICIENT_PERMISSIONS', 'client.manager_required');
    }
    return this.clientService.resendPassword(id, user.currentTenantIdGerente);
  }

  // Helper para decidir qual Tenant ID usar (Gestor tem o dele, Assistente tem o contexto)
  private resolveTenantId(user: GetUserDto): string {
    if (user.currentTenantIdGerente) {
      return user.currentTenantIdGerente;
    }
    // Se for assistente, precisamos pegar o tenant do contexto ou do primeiro disponível
    // IMPORTANTE: Idealmente o Frontend manda 'X-Tenant-ID' no header se o assistente tiver múltiplos
    // Por enquanto, vamos pegar o primeiro da lista de assistente se não houver contexto explícito
    if (user.currentTenantIdAssistentes && user.currentTenantIdAssistentes.length > 0) {
      return user.currentTenantIdAssistentes[0];
    }

    throw new BusinessException(
      'TENANT_CONTEXT_MISSING',
      'Não foi possível identificar a empresa.',
    );
  }
}
