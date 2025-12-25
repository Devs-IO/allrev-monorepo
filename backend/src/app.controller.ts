import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@SkipThrottle()
@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HealthCheck()
  check() {
    // "database" é apenas um nome arbitrário para o indicador
    return this.health.check([
      () =>
        this.db.pingCheck('database', {
          timeout: 1500, // em ms
        }),
    ]);
  }
}
