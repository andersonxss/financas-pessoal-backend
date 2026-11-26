import type { QueryRunner } from 'typeorm';
import { NormalizeMoneyColumns1793923200000 } from './1793923200000-NormalizeMoneyColumns';

describe('money migration', () => {
  it('locks and validates both tables before altering either column', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await new NormalizeMoneyColumns1793923200000().up({ query } as unknown as QueryRunner);
    const sql = query.mock.calls.map(call => call[0]);
    expect(sql[0]).toContain('LOCK TABLE');
    expect(sql[1]).toContain('SELECT 1 FROM "gastos"');
    expect(sql[2]).toContain('SELECT 1 FROM "receitas"');
    expect(sql[3]).toContain('ALTER TABLE "gastos"');
    expect(sql[4]).toContain('ALTER TABLE "receitas"');
  });
  it('aborts without altering columns when either table has invalid data', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ found: 1 }]);
    await expect(new NormalizeMoneyColumns1793923200000().up({ query } as unknown as QueryRunner)).rejects.toThrow('receitas');
    expect(query.mock.calls.some(call => call[0].includes('ALTER TABLE'))).toBe(false);
  });
});
