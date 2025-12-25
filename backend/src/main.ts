import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  ConfigModule.forRoot();

  app.enableCors({
    origin: ['http://localhost:4200', 'https://allrev-frontend.netlify.app'],
    //origin: '*', // Permite todas as origens (não recomendado para produção)
    //allowedHeaders: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['FileName'],
  });

  // Validação e sanitização global
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove propriedades que não estão definidas nos DTOs
      whitelist: true,
      // Lança erro se houver propriedades não previstas
      forbidNonWhitelisted: true,
      // Transforma payloads JSON em instâncias de classes DTO
      transform: true,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend rodando em http://0.0.0.0:${port}`);
}
bootstrap();
