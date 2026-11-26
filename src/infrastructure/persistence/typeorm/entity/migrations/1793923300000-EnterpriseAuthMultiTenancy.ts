import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const TENANT_TABLES = [
  'users',
  'status',
  'categorias',
  'parcelas',
  'pagamentos',
  'gastos',
  'receitas',
  'tenant_invites',
  'auth_tokens',
];

export class EnterpriseAuthMultiTenancy1793923300000 implements MigrationInterface {
  name = 'EnterpriseAuthMultiTenancy1793923300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        slug varchar(80) NOT NULL UNIQUE,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `INSERT INTO tenants (id, name, slug) VALUES ($1, 'Tenant principal', 'principal') ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_TENANT_ID],
    );

    for (const table of TENANT_TABLES.slice(0, 7)) {
      if (!(await queryRunner.hasTable(table))) continue;
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS tenant_id uuid`);
      await queryRunner.query(`UPDATE "${table}" SET tenant_id = $1 WHERE tenant_id IS NULL`, [DEFAULT_TENANT_ID]);
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN tenant_id SET NOT NULL`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_${table}_tenant" ON "${table}" (tenant_id)`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_${table}_tenant_id" ON "${table}" (tenant_id, id)`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "FK_${table}_tenant"`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_tenant" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT`);
    }

    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'MEMBER'`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash varchar(64)`);
    await queryRunner.query(`UPDATE users SET role = 'ADMIN' WHERE tenant_id = $1`, [DEFAULT_TENANT_ID]);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_tenant_email" ON users (tenant_id, lower(email))`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_invites (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email varchar(254) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'MEMBER',
        token_hash varchar(64) NOT NULL,
        invited_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        expires_at timestamptz NOT NULL,
        accepted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invites_tenant_email" ON tenant_invites (tenant_id, lower(email))`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(30) NOT NULL,
        token_hash varchar(64) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_tokens_tenant_user" ON auth_tokens (tenant_id, user_id, type)`);

    await this.addTenantRelation(queryRunner, 'categorias', 'status_id', 'status');
    await this.addTenantRelation(queryRunner, 'parcelas', 'status_id', 'status');
    await this.addTenantRelation(queryRunner, 'pagamentos', 'status_id', 'status');
    await this.addTenantRelation(queryRunner, 'gastos', 'categoria_id', 'categorias');
    await this.addTenantRelation(queryRunner, 'gastos', 'status_id', 'status');
    await this.addTenantRelation(queryRunner, 'gastos', 'parcela_id', 'parcelas');
    await this.addTenantRelation(queryRunner, 'gastos', 'pagamento_id', 'pagamentos');
    await this.addTenantRelation(queryRunner, 'receitas', 'categoria_id', 'categorias');
    await this.addTenantRelation(queryRunner, 'receitas', 'status_id', 'status');

    const policyPredicate = `(tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.user_role', true) = 'SUPER_ADMIN')`;
    for (const table of TENANT_TABLES) {
      if (!(await queryRunner.hasTable(table))) continue;
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`);
      await queryRunner.query(`CREATE POLICY tenant_isolation ON "${table}" USING (${policyPredicate}) WITH CHECK (${policyPredicate})`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TENANT_TABLES) {
      if (!(await queryRunner.hasTable(table))) continue;
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS auth_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_invites`);
    for (const table of TENANT_TABLES.slice(0, 7).reverse()) {
      if (!(await queryRunner.hasTable(table))) continue;
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS tenant_id CASCADE`);
    }
    if (await queryRunner.hasTable('users')) {
      await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS refresh_token_hash`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS active`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS role`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS tenants`);
  }

  private async addTenantRelation(
    queryRunner: QueryRunner,
    sourceTable: string,
    sourceColumn: string,
    targetTable: string,
  ): Promise<void> {
    if (!(await queryRunner.hasTable(sourceTable)) || !(await queryRunner.hasTable(targetTable))) return;
    const constraint = `FK_${sourceTable}_${sourceColumn}_tenant`;
    await queryRunner.query(`ALTER TABLE "${sourceTable}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
    await queryRunner.query(`ALTER TABLE "${sourceTable}" ADD CONSTRAINT "${constraint}" FOREIGN KEY (tenant_id, "${sourceColumn}") REFERENCES "${targetTable}" (tenant_id, id) ON DELETE RESTRICT`);
  }
}
