import { randomUUID } from 'node:crypto';
import { DataSource, QueryRunner } from 'typeorm';

const database = process.env.POSTGRES_DB ?? 'finance';
const host = process.env.POSTGRES_HOST ?? 'localhost';
const port = Number(process.env.POSTGRES_PORT ?? 5432);

const owner = new DataSource({
  type: 'postgres',
  host,
  port,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database,
});

const runtime = new DataSource({
  type: 'postgres',
  host,
  port,
  username: process.env.POSTGRES_APP_USER ?? 'finance_app',
  password: process.env.POSTGRES_APP_PASSWORD ?? 'finance_app_local_password',
  database,
});

describe('PostgreSQL tenant isolation', () => {
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const statusA = randomUUID();
  const statusB = randomUUID();
  let runner: QueryRunner | undefined;

  beforeAll(async () => {
    await owner.initialize();
    await runtime.initialize();
    await owner.query(
      `INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [tenantA, 'RLS test A', `rls-a-${tenantA}`, tenantB, 'RLS test B', `rls-b-${tenantB}`],
    );
  });

  afterAll(async () => {
    if (runner?.isTransactionActive) await runner.rollbackTransaction();
    if (runner) await runner.release();
    if (owner.isInitialized) {
      await owner.query(`DELETE FROM tenants WHERE id = ANY($1::uuid[])`, [[tenantA, tenantB]]);
    }
    if (runtime.isInitialized) await runtime.destroy();
    if (owner.isInitialized) await owner.destroy();
  });

  it('uses a restricted runtime role and blocks cross-tenant reads and writes', async () => {
    const [role] = await runtime.query(
      `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
    );
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });

    const protectedTables = await owner.query(
      `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = ANY($1::text[])
         AND c.relkind = 'r'
       ORDER BY c.relname`,
      [['auth_tokens', 'categorias', 'gastos', 'pagamentos', 'parcelas', 'receitas', 'status', 'tenant_invites', 'users']],
    );
    expect(protectedTables).toHaveLength(9);
    expect(protectedTables.every((table: { relrowsecurity: boolean; relforcerowsecurity: boolean }) => (
      table.relrowsecurity && table.relforcerowsecurity
    ))).toBe(true);

    runner = runtime.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    await runner.query(
      `SELECT set_config('app.tenant_id', $1, true), set_config('app.user_role', 'MEMBER', true)`,
      [tenantA],
    );
    await runner.query(`INSERT INTO status (id, tenant_id, name) VALUES ($1, $2, $3)`, [statusA, tenantA, 'Visible']);

    await runner.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantB]);
    await runner.query(`INSERT INTO status (id, tenant_id, name) VALUES ($1, $2, $3)`, [statusB, tenantB, 'Hidden']);

    await runner.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantA]);
    const visible = await runner.query(
      `SELECT id, tenant_id AS "tenantId" FROM status WHERE id = ANY($1::uuid[]) ORDER BY id`,
      [[statusA, statusB]],
    );
    expect(visible).toEqual([{ id: statusA, tenantId: tenantA }]);

    const update = await runner.query(`UPDATE status SET name = 'tampered' WHERE id = $1`, [statusB]);
    expect(update[1]).toBe(0);
  });
});
