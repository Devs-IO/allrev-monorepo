import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/database/database.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ClientModule } from './modules/client/client.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { FunctionalityModule } from './modules/functionality/functionality.module';
import { EmailModule } from './modules/email/email.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'config/env/.env',
      isGlobal: true,
    }),
    TerminusModule,
    TypeOrmModule, // só para injetar o TypeOrmHealthIndicator
    // SwaggerModule.forRoot({
    //   swaggerOptions: {
    //     docExpansion: 'none',
    //     filter: true,
    //     showRequestDuration: true,
    //   },
    //   swaggerUrl: '/api',
    //   swaggerPath: '/api-json',
    // }),
    DatabaseModule,
    UserModule,
    AuthModule,
    TenantModule,
    ClientModule,
    FunctionalityModule,
    EmailModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {}
}
