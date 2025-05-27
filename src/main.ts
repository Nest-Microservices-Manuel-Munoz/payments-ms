import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('PaymentsMS-main');

  // this is for REST API
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook handling
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // this is for NATS microservice
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
      },
    },
    {
      inheritAppConfig: true, // Inherit the app's configuration
    },
  );

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Payments Microervice running on port: ${envs.port}`);
}
bootstrap();
