import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import 'dotenv/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        console.log('Conectando ao banco de dados...');
        console.log(`Configuração do TypeORM iniciada. .${process.env.NODE_ENV}.env`);
        console.log(`URL do banco de dados: ${databaseUrl}`);

        if (!databaseUrl) {
          console.error(
            'Erro: variável DATABASE_URL não definida no arquivo de ambiente ou nos secrets.',
          );
        }

        const sslEnabled =
          (configService.get<string>('DATABASE_SSL') || '').toLowerCase() === 'true';
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true, // Carrega automaticamente as entidades
          // Evite synchronize; use migrações sempre para consistência
          synchronize: true,
          migrations: ['dist/config/database/migrations/*.js'],
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          // Rode migrações automaticamente fora do dev
          migrationsRun: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
