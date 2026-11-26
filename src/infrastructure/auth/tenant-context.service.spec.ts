import { UserRole } from '@entities';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  it('sets PostgreSQL request variables and exposes the scoped manager', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const manager = { query };
    const dataSource = {
      transaction: (callback: (value: typeof manager) => Promise<unknown>) =>
        callback(manager),
    };
    const service = new TenantContextService();

    const result = await service.runInTransaction(
      dataSource as never,
      { tenantId: 'tenant-a', userId: 'user-a', role: UserRole.ADMIN },
      () =>
        Promise.resolve({
          tenantId: service.requireTenantId(),
          userId: service.requireUserId(),
          manager: service.manager,
        }),
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("set_config('app.tenant_id'"),
      ['tenant-a', UserRole.ADMIN],
    );
    expect(result).toEqual({ tenantId: 'tenant-a', userId: 'user-a', manager });
    expect(service.tenantId).toBeUndefined();
  });

  it('runs cache invalidation only after the transaction commits', async () => {
    const events: string[] = [];
    const manager = { query: jest.fn().mockResolvedValue(undefined) };
    const dataSource = {
      transaction: async (
        callback: (value: typeof manager) => Promise<unknown>,
      ) => {
        const result = await callback(manager);
        events.push('commit');
        return result;
      },
    };
    const service = new TenantContextService();

    await service.runInTransaction(
      dataSource as never,
      { tenantId: 'tenant-a', userId: 'user-a', role: UserRole.ADMIN },
      async () => {
        events.push('command');
        await service.runAfterCommit(() => {
          events.push('invalidate');
          return Promise.resolve();
        });
      },
    );

    expect(events).toEqual(['command', 'commit', 'invalidate']);
  });

  it('does not invalidate the cache when the transaction rolls back', async () => {
    const invalidate = jest.fn().mockResolvedValue(undefined);
    const manager = { query: jest.fn().mockResolvedValue(undefined) };
    const dataSource = {
      transaction: (callback: (value: typeof manager) => Promise<unknown>) =>
        callback(manager),
    };
    const service = new TenantContextService();

    await expect(
      service.runInTransaction(
        dataSource as never,
        { tenantId: 'tenant-a', userId: 'user-a', role: UserRole.ADMIN },
        async () => {
          await service.runAfterCommit(invalidate);
          throw new Error('rollback');
        },
      ),
    ).rejects.toThrow('rollback');

    expect(invalidate).not.toHaveBeenCalled();
  });
});
