import { ConfigService } from '@nestjs/config';

export const rabbitMQConfig = (config: ConfigService) => ({
    uri: config.get<string>('RABBITMQ_URI'),
    exchange: config.get<string>('RABBITMQ_EXCHANGE', 'domain-events'),
});