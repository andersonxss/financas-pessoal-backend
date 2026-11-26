import { RedisCacheService } from "../cache/redis/redis-cache.service";

export const RedisProvider = {
    provide: 'RedisService',
    useClass: RedisCacheService,
};