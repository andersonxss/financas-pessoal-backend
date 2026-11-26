import { ConfigService } from '@nestjs/config';
import { rabbitMQConfig, createRabbitMQChannel } from '@infrastructure/messaging';


export const RabbitMQChannelProvider = {
    provide: 'RABBITMQ_CHANNEL',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const config = rabbitMQConfig(configService);

        if (!config.uri || !config.exchange) {
            throw new Error('RABBITMQ_URI or RABBITMQ_EXCHANGE is not defined');
        }

        const channel = await createRabbitMQChannel(config.uri);

        await channel.assertExchange(config.exchange, 'topic', {
            durable: true,
        });

        return channel;
    },
};
