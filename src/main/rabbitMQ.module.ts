import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule, CommandBus } from '@nestjs/cqrs';
import { RabbitMQEventBus, rabbitMQConfig } from '@infrastructure/messaging';
import { RabbitMQChannelProvider } from 'src/infrastructure/providers/rabbitmq.providers';
import { TenantContextService } from '../infrastructure/auth/tenant-context.service';
import { DataSource } from 'typeorm';

@Module({
  imports: [CqrsModule],
  providers: [
    RabbitMQChannelProvider,
    {
      provide: 'EventBus',
      inject: [
        'RABBITMQ_CHANNEL',
        ConfigService,
        CommandBus,
        TenantContextService,
        DataSource,
      ],
      useFactory: (
        channel,
        configService: ConfigService,
        commandBus: CommandBus,
        tenantContext: TenantContextService,
        dataSource: DataSource,
      ) => {
        const config = rabbitMQConfig(configService);
        return new RabbitMQEventBus(
          channel,
          config.exchange,
          commandBus,
          tenantContext,
          dataSource,
        );
      },
    },
  ],
  exports: ['EventBus'],
})
export class RabbitMQModule {}
