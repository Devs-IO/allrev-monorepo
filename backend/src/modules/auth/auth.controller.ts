import { Body, Controller, HttpCode, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../@shared/decorator/get-user.decorator';
import type { GetUserDto } from '../../@shared/dto/get-user.dto';
import { ClientLoginDto } from '../client/dto/client-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Realizar login do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso, retorna o token JWT',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: any) {
    const userId = req.user.sub; // sub do payload
    const refreshToken = req.user.refreshToken; // token validado
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Put('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  async changePassword(@GetUser() user: GetUserDto, @Body() body: ChangePasswordDto) {
    await this.authService.changePassword(user.id, body.newPassword);
    return { success: true };
  }

  @Put('client/change-password')
  @UseGuards(AuthGuard('jwt-client'))
  @ApiOperation({ summary: 'Alterar senha do cliente autenticado' })
  @ApiResponse({ status: 200, description: 'Senha do cliente alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Cliente não autenticado' })
  async changeClientPassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    await this.authService.changePassword(req.user.sub, body.newPassword);
    return { success: true };
  }

  @Post('client/login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(@Body() loginDto: ClientLoginDto) {
    return this.authService.loginClient(loginDto);
  }
}
