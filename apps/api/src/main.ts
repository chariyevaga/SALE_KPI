import './config/load-environment.js';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { getApiPort, getCorsOrigin } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getCorsOrigin(),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Retail KPI Platform API')
    .setDescription(
      'Logo Tiger tabanlı bağımsız perakende KPI platformu için NestJS REST API sözleşmesi.',
    )
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Swagger UI assets are served by the API itself; the null validatorUrl keeps it from
  // calling validator.swagger.io (ADR-042).
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { validatorUrl: null },
  });

  await app.listen(getApiPort(), '0.0.0.0');
}

void bootstrap();
