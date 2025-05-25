import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('PaymentsMS-main');
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook handling
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Payments Microervice running on port: ${envs.port}`);
}
bootstrap();
