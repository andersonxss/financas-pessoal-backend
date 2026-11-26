import { RedisService } from '@domain/services';
import { Injectable, Logger } from '@nestjs/common';
import { redisClient } from './redis.client';
import { redisConfig } from './redis.config';
import { TenantContextService } from '../../auth/tenant-context.service';

@Injectable()
export class RedisCacheService implements RedisService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(this.scoped(key));
    return data ? JSON.parse(data) : null;
  }

  async findByPattern<T>(
    pattern: string,
  ): Promise<Array<{ key: string; value: T }>> {
    const entries = new Map<string, T>();
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        this.scoped(pattern),
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length === 0) {
        continue;
      }

      const values = await redisClient.mget(...keys);

      keys.forEach((key, index) => {
        const value = values[index];

        if (value !== null) {
          entries.set(this.unscoped(key), JSON.parse(value) as T);
        }
      });
    } while (cursor !== '0');

    return Array.from(entries, ([key, value]) => ({ key, value }));
  }

  async set<T>(key: string, value: T, ttl = redisConfig.ttl): Promise<void> {
    await redisClient.set(this.scoped(key), JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string): Promise<boolean> {
    return (await redisClient.del(this.scoped(key))) > 0;
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const scopedPattern = this.scoped(pattern);

    await this.tenantContext.runAfterCommit(async () => {
      try {
        await this.deleteByPattern(scopedPattern);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'erro desconhecido';
        this.logger.warn(`Falha ao invalidar cache do tenant: ${message}`);
      }
    });
  }

  private async deleteByPattern(scopedPattern: string): Promise<void> {
    const keys = new Set<string>();
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await redisClient.scan(
        cursor,
        'MATCH',
        scopedPattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      foundKeys.forEach((key) => keys.add(key));
    } while (cursor !== '0');

    if (keys.size > 0) await redisClient.del(...keys);
  }

  private scoped(key: string): string {
    return `tenant:${this.tenantContext.requireTenantId()}:${key}`;
  }

  private unscoped(key: string): string {
    const prefix = `tenant:${this.tenantContext.requireTenantId()}:`;
    return key.startsWith(prefix) ? key.slice(prefix.length) : key;
  }
}
