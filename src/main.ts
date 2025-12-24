import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filter';
import { AuditService } from './modules/audit/audit.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.enableCors(); // TODO: Configure CORS properly for production

  const auditService = app.get(AuditService);
  app.useGlobalFilters(new GlobalExceptionFilter(auditService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('WasiGo API')
    .setDescription('Backend de la plataforma de carpooling WasiGo')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWE',
        description: 'Ingrese su token JWE (Login)',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT ?? 3000);

  logger.log(`App running on port ${process.env.PORT ?? 3000}`);
  logger.log(
    `Swagger Docs available at http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
