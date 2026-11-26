export interface RedisService {
    get<T>(key: string): Promise<T | null>;
    findByPattern<T>(pattern: string): Promise<Array<{ key: string; value: T }>>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<boolean>;
    invalidateByPattern(pattern: string): Promise<void>;
}
