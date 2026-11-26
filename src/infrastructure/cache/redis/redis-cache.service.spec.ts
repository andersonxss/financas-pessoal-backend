import { TenantContextService } from '../../auth/tenant-context.service';
import { RedisCacheService } from './redis-cache.service';

const mockScan = jest.fn();
const mockDel = jest.fn();

jest.mock('./redis.client', () => ({
  redisClient: {
    scan: (...args: unknown[]): Promise<[string, string[]]> =>
      mockScan(...args) as Promise<[string, string[]]>,
    del: (...args: unknown[]): Promise<number> =>
      mockDel(...args) as Promise<number>,
  },
}));

describe('RedisCacheService', () => {
  beforeEach(() => {
    mockScan.mockReset();
    mockDel.mockReset();
  });

  it('remove somente as chaves do padrão no tenant atual', async () => {
    mockScan
      .mockResolvedValueOnce([
        '7',
        ['tenant:tenant-a:home:despesas:total'],
      ] as never)
      .mockResolvedValueOnce([
        '0',
        ['tenant:tenant-a:home:despesas:pagamentos:2026'],
      ] as never);
    mockDel.mockResolvedValue(2);

    const tenantContext = {
      requireTenantId: jest.fn().mockReturnValue('tenant-a'),
      runAfterCommit: jest.fn((callback: () => Promise<void>) => callback()),
    } as unknown as TenantContextService;
    const service = new RedisCacheService(tenantContext);

    await expect(
      service.invalidateByPattern('home:despesas:*'),
    ).resolves.toBeUndefined();

    expect(mockScan).toHaveBeenNthCalledWith(
      1,
      '0',
      'MATCH',
      'tenant:tenant-a:home:despesas:*',
      'COUNT',
      100,
    );
    expect(mockScan).toHaveBeenNthCalledWith(
      2,
      '7',
      'MATCH',
      'tenant:tenant-a:home:despesas:*',
      'COUNT',
      100,
    );
    expect(mockDel).toHaveBeenCalledWith(
      'tenant:tenant-a:home:despesas:total',
      'tenant:tenant-a:home:despesas:pagamentos:2026',
    );
  });

  it('não chama DEL quando nenhuma chave é encontrada', async () => {
    mockScan.mockResolvedValue(['0', []]);
    const tenantContext = {
      requireTenantId: jest.fn().mockReturnValue('tenant-a'),
      runAfterCommit: jest.fn((callback: () => Promise<void>) => callback()),
    } as unknown as TenantContextService;
    const service = new RedisCacheService(tenantContext);

    await expect(
      service.invalidateByPattern('home:receitas:*'),
    ).resolves.toBeUndefined();
    expect(mockDel).not.toHaveBeenCalled();
  });
});
