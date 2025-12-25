import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '@nestjs/passport'; // Para autenticação
import { RolesGuard } from '../../@shared/guards/roles.guard';
import { Roles } from '../../@shared/decorator/roles.decorator';
import { Role } from '../../@shared/enums/roles.enum';

@Controller('tenants')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Proteção em todas as rotas
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles(Role.ADMIN) // Restrito à role ADMIN
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @Roles(Role.ADMIN) // Restrito à role ADMIN
  findAll() {
    return this.tenantService.findAll();
  }

  @Get('without-manager/list')
  @Roles(Role.ADMIN) // Restrito à role ADMIN
  findTenantsWithoutManager() {
    return this.tenantService.findTenantsWithoutManager();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id); // Acessível por todas as roles
  }

  @Put(':id')
  @Roles(Role.ADMIN) // Restrito à role ADMIN
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Restrito à role ADMIN
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
