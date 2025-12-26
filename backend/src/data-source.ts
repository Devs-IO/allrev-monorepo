import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({
  path: `.${process.env.NODE_ENV}.env`,
});

export const AppDataSource = new DataSource({
  type: 'postgres',

  url: process.env.DATABASE_URL,

  // Em desenvolvimento, rodar migrations automaticamente também
  // Em produção, não use synchronize; use migrations
  // synchronize: process.env.NODE_ENV === 'development',
  migrationsRun: true, // Sempre rodar migrations

  // opcional: para ver logs de SQL no console
  //logging: true,

  //entities: ['./src/modules/**/*.entity{.ts,.js}'], // Caminho relativo direto
  //migrations: ['./src/config/database/migrations/*.ts'], // Caminho para suas migrações
  entities: ['./dist/modules/**/*.entity{.js,.js}'],
  migrations: [
    './dist/config/database/migrations/1700000099001-BaselineCore.js',
    './dist/config/database/migrations/1700000099002-BaselineFunctionalities.js',
    './dist/config/database/migrations/1700000099003-BaselineOrders.js',
    './dist/config/database/migrations/1700000099004-SeedAdminUser.js',
  ],

  extra: {
    connectionLimit: 10, // Limite de conexões para o pool
  },
  ssl: {
    rejectUnauthorized: false,
  },
});
