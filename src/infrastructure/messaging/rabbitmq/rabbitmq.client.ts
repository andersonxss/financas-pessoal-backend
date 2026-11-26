import amqp, { Channel } from 'amqplib';

export async function createRabbitMQChannel(uri: string): Promise<Channel> {
    const connection = await amqp.connect(uri);
    return connection.createChannel();
}
