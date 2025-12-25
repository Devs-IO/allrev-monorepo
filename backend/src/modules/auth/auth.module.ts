import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ClientJwtStrategy } from './strategies/client-jwt.strategy';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey', // Configure isso no .env
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
    TenantModule,
    ClientModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ClientJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
