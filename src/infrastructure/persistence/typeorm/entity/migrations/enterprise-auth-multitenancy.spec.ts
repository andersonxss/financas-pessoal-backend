import { EnterpriseAuthMultiTenancy1793923300000 } from './1793923300000-EnterpriseAuthMultiTenancy';

describe('EnterpriseAuthMultiTenancy migration', () => {
  it('enables forced RLS and tenant-safe composite relations', async () => {
    const statements: string[] = [];
    const queryRunner = {
      hasTable: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockImplementation(async (sql: string) => {
        statements.push(sql.replace(/\s+/g, ' ').trim());
      }),
    };

    await new EnterpriseAuthMultiTenancy1793923300000().up(queryRunner as never);

    expect(statements).toContain('ALTER TABLE "users" ENABLE ROW LEVEL SECURITY');
    expect(statements).toContain('ALTER TABLE "users" FORCE ROW LEVEL SECURITY');
    expect(statements.some((sql) => sql.includes('CREATE POLICY tenant_isolation ON "gastos"'))).toBe(true);
    expect(statements.some((sql) => sql.includes('FOREIGN KEY (tenant_id, "categoria_id") REFERENCES "categorias" (tenant_id, id)'))).toBe(true);
    expect(statements.some((sql) => sql.includes('UQ_users_tenant_email'))).toBe(true);
  });
});
