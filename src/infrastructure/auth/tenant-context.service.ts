import { UserRole } from '@entities';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager } from 'typeorm';

interface TenantStore {
  tenantId: string;
  userId: string;
  role: UserRole;
  manager: EntityManager;
  afterCommitCallbacks: Array<() => Promise<void>>;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  get tenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  get userId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  get role(): UserRole | undefined {
    return this.storage.getStore()?.role;
  }

  get manager(): EntityManager | undefined {
    return this.storage.getStore()?.manager;
  }

  requireTenantId(): string {
    const tenantId = this.tenantId;
    if (!tenantId)
      throw new UnauthorizedException('Contexto do tenant ausente');
    return tenantId;
  }

  requireUserId(): string {
    const userId = this.userId;
    if (!userId) throw new UnauthorizedException('Contexto do usuário ausente');
    return userId;
  }

  async runInTransaction<T>(
    dataSource: DataSource,
    context: Omit<TenantStore, 'manager' | 'afterCommitCallbacks'>,
    callback: () => Promise<T>,
  ): Promise<T> {
    const afterCommitCallbacks: Array<() => Promise<void>> = [];
    const result = await dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('app.tenant_id', $1, true), set_config('app.user_role', $2, true)`,
        [context.tenantId, context.role],
      );

      return this.storage.run(
        { ...context, manager, afterCommitCallbacks },
        callback,
      );
    });

    for (const afterCommit of afterCommitCallbacks) {
      await afterCommit();
    }

    return result;
  }

  async runAfterCommit(callback: () => Promise<void>): Promise<void> {
    const store = this.storage.getStore();
    if (!store) {
      await callback();
      return;
    }

    store.afterCommitCallbacks.push(callback);
  }
}
