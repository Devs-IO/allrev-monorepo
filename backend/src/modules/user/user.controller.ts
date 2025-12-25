import { Body, Put, Param, Controller, Get, UseGuards, Delete, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../@shared/guards/roles.guard';
import { UserService } from './user.service';
import { GetUser } from '../../@shared/decorator/get-user.decorator';
import { User } from './entities/user.entity';
import { Roles } from '../../@shared/decorator/roles.decorator';
import { Role } from '../../@shared/enums/roles.enum';
import { ResponseUserDto } from './dto/response-user.dto';
import type { GetUserDto } from '../../@shared/dto/get-user.dto';
import { ResponseUserProfileDto } from './dto/response-user-profile.dto';
import { BusinessException } from '../../@shared/exception/business.exception';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER_REVIEWERS) // Apenas ADMIN e MANAGER_REVIEWERS podem registrar
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiOperation({ summary: 'Cria um novo usuário e vínculo com tenant/role' })
  async createUser(@Body() createUserDto: any, @GetUser() currentUser: GetUserDto): Promise<void> {
    await this.userService.create(createUserDto, { id: currentUser.id });
  }

  @Get('profile')
  @ApiOperation({ summary: 'Busca os dados do usuário logado' })
  async getProfile(@GetUser() user: GetUserDto): Promise<ResponseUserProfileDto> {
    return await this.userService.findByIdProfile(user.id);
  }

  @Get('me')
  @Roles(Role.ADMIN, Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Busca os dados completos do usuário logado' })
  async getMe(@GetUser() user: GetUserDto): Promise<ResponseUserDto> {
    return await this.userService.findById(user.id);
  }

  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lista todos os usuários (somente ADMIN)' })
  async findAll(@GetUser() user: GetUserDto) {
    return await this.userService.findAll(user);
  }

  @Get('children')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Lista os usuários vinculados ao usuário logado' })
  async findChildrenUsers(@GetUser() user: GetUserDto) {
    return await this.userService.findChildrenUsers({ id: user.id });
  }

  @Get('available-roles')
  @Roles(Role.MANAGER_REVIEWERS, Role.ADMIN)
  @ApiOperation({
    summary: 'Retorna as roles disponíveis para criação de usuário baseado no usuário logado',
  })
  async getAvailableRoles(@GetUser() user: GetUserDto) {
    if (user.isAdminTrue) {
      return [Role.MANAGER_REVIEWERS];
    }
    // Se não for admin, assumimos manager (guard já garante) => apenas assistente
    return [Role.ASSISTANT_REVIEWERS];
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER_REVIEWERS) // Admin e Gestor podem chamar
  @ApiOperation({ summary: 'Busca usuário por ID (Logica adaptativa Admin/Gestor)' })
  async findOne(@Param('id') id: string, @GetUser() currentUser: GetUserDto) {
    // O Service decide se retorna visão Full (Admin) ou visão Assistente (Gestor)
    return await this.userService.findOneSmart(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Edita os dados do usuário por ID (ADMIN ou MANAGER)' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
    @GetUser() currentUser: GetUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto, currentUser);
  }

  @Delete('assistants/:id')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({
    summary: 'Remove o vínculo de um assistente com o tenant atual (Soft Delete Contextual)',
  })
  async removeAssistant(@Param('id') id: string, @GetUser() user: GetUserDto): Promise<void> {
    if (!user.currentTenantIdGerente) {
      throw new BusinessException('FORBIDDEN', 'Gestor sem contexto de tenant.');
    }
    return await this.userService.removeAssistantFromTenant(id, user.currentTenantIdGerente);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativa um usuário globalmente (Somente Admin)' })
  async removeUserGlobal(
    @Param('id') id: string,
    @GetUser() currentUser: GetUserDto,
  ): Promise<void> {
    return await this.userService.remove(id, currentUser);
  }

  @Get('assistants/:id')
  @Roles(Role.MANAGER_REVIEWERS)
  @ApiOperation({ summary: 'Retorna assistente por ID (somente gestor do mesmo tenant)' })
  async getAssistantById(@Param('id') id: string, @GetUser() currentUser: GetUserDto) {
    return this.userService.findAssistantByIdForManager(id, currentUser);
  }
}
