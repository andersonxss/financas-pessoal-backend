import Redis from 'ioredis';
import { redisConfig } from './redis.config';

export const redisClient = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
});
