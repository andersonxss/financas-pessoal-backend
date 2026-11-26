import type { RedisService } from '@domain/services';
import {
  getCachedHomeReport,
  homeReportCacheKeys,
  invalidateHomeDespesasCache,
  invalidateHomeReceitasCache,
} from './homeReportCache';

const createRedisService = (
  overrides: Partial<RedisService> = {},
): jest.Mocked<RedisService> =>
  ({
    get: jest.fn(),
    findByPattern: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidateByPattern: jest.fn(),
    ...overrides,
  }) as jest.Mocked<RedisService>;

describe('homeReportCache', () => {
  it('retorna o valor em cache sem consultar o banco', async () => {
    const cached = [{ total: 100 }];
    const set = jest.fn();
    const redisService = createRedisService({
      get: jest.fn().mockResolvedValue(cached),
      set,
    });
    const load = jest.fn();

    await expect(
      getCachedHomeReport(redisService, 'home:despesas:total', load),
    ).resolves.toEqual(cached);

    expect(load).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it('consulta o banco e armazena inclusive resultados vazios', async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const redisService = createRedisService({
      get: jest.fn().mockResolvedValue(null),
      set,
    });
    const load = jest.fn().mockResolvedValue([]);

    await expect(
      getCachedHomeReport(
        redisService,
        homeReportCacheKeys.despesasMensais(2026),
        load,
      ),
    ).resolves.toEqual([]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith('home:despesas:mensais:2026', []);
  });

  it('continua consultando o banco quando o Redis está indisponível', async () => {
    const redisService = createRedisService({
      get: jest.fn().mockRejectedValue(new Error('Redis indisponível')),
      set: jest.fn().mockRejectedValue(new Error('Redis indisponível')),
    });
    const load = jest.fn().mockResolvedValue([{ total: 50 }]);

    await expect(
      getCachedHomeReport(redisService, 'home:despesas:total', load),
    ).resolves.toEqual([{ total: 50 }]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('invalida separadamente os relatórios de despesas e receitas', async () => {
    const invalidateByPattern = jest.fn().mockResolvedValue(undefined);
    const redisService = createRedisService({
      invalidateByPattern,
    });

    await invalidateHomeDespesasCache(redisService);
    await invalidateHomeReceitasCache(redisService);

    expect(invalidateByPattern).toHaveBeenNthCalledWith(1, 'home:despesas:*');
    expect(invalidateByPattern).toHaveBeenNthCalledWith(2, 'home:receitas:*');
  });

  it('não desfaz uma gravação quando a invalidação do Redis falha', async () => {
    const redisService = createRedisService({
      invalidateByPattern: jest
        .fn()
        .mockRejectedValue(new Error('Redis indisponível')),
    });

    await expect(
      invalidateHomeDespesasCache(redisService),
    ).resolves.toBeUndefined();
  });
});
