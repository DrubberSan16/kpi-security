import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = Number(config.get('PORT') || 3000);
  const basePath = String(config.get('BASE_PATH') || '').trim(); // /kpi_security
  const globalPrefix = basePath.replace(/^\//, '').replace(/\/$/, ''); // kpi_security

  if (globalPrefix) app.setGlobalPrefix(globalPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(globalPrefix || 'API')
    .setDescription('API Documentation')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // ✅ Swagger SIEMPRE en /<prefix>/docs
  const swaggerPath = globalPrefix ? `${globalPrefix}/docs` : 'docs';
  SwaggerModule.setup(swaggerPath, app, document);

  await app.listen(port, '127.0.0.1');
}
bootstrap();
