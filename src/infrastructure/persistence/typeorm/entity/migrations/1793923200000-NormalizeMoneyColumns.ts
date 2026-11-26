import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeMoneyColumns1793923200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lock both tables before checking to prevent writes between validation and ALTER.
    await queryRunner.query('LOCK TABLE "gastos", "receitas" IN ACCESS EXCLUSIVE MODE');
    for (const table of ['gastos', 'receitas']) {
      const invalid = await queryRunner.query(
        `SELECT 1 FROM "${table}" WHERE valor::text IN ('NaN', 'Infinity', '-Infinity') OR abs(valor) > 99999999.99 OR valor <> trunc(valor, 2) LIMIT 1`,
      );
      if (invalid.length) throw new Error('Existem valores incompat?veis com numeric(10,2) em ' + table + '. Revise os dados antes da migration.');
    }
    for (const table of ['gastos', 'receitas']) {
      await queryRunner.query('ALTER TABLE "' + table + '" ALTER COLUMN "valor" TYPE numeric(10,2) USING "valor"::numeric(10,2)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Original migrations declared unconstrained decimal for both tables.
    for (const table of ['gastos', 'receitas']) {
      await queryRunner.query('ALTER TABLE "' + table + '" ALTER COLUMN "valor" TYPE numeric');
    }
  }
}
