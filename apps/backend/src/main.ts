import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for payment-provider webhook signature verification
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const swaggerEnabled = config.get<boolean>('app.swaggerEnabled') ?? false;
  const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [];

  // ── Pino structured logger ──────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Global prefix ───────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/queues'] });

  // ── CORS ────────────────────────────────────────────────────────────
  app.enableCors({ origin: corsOrigins, credentials: true });

  // ── Validation pipe ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger / OpenAPI ───────────────────────────────────────────────
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Shopflow API')
      .setDescription('Shopflow Social Ecommerce Platform — Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('sellers', 'Seller storefront and onboarding')
      .addTag('catalog', 'Products and categories')
      .addTag('orders', 'Order lifecycle management')
      .addTag('payments', 'Paystack and Monnify payment integration')
      .addTag('health', 'System health checks')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 Shopflow API running on: http://localhost:${port}/api/v1`);
  if (swaggerEnabled) {
    console.log(`📖 Swagger docs: http://localhost:${port}/api-docs`);
  }
}

void bootstrap();
