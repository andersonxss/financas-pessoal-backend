import { NestFactory } from '@nestjs/core';
import { AppModule } from './main/app.module';
import { ConfigService } from '@nestjs/config';
import { ProcessDespesaEvent, ProcessReceitaEvent } from '@events';
import { type INestApplicationContext, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import type { EventBus } from './application/event-bus/event-bus';

class ConfiguredIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origin: string,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origin, credentials: true },
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontendUrl =
    config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  app.useWebSocketAdapter(new ConfiguredIoAdapter(app, frontendUrl));
  if (config.get<string>('TRUST_PROXY') === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const eventBus = app.get<EventBus>('EventBus');
  await eventBus.consume(new ProcessDespesaEvent());
  await eventBus.consume(new ProcessReceitaEvent());

  await app.listen(process.env.PORT ?? 3333);
}
void bootstrap();
