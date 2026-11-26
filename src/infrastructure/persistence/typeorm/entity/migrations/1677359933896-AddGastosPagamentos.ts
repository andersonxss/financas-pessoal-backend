import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddGastosPagamentos1677359933896 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'gastos',
      new TableColumn({
        name: 'pagamento_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'gastos',
      new TableForeignKey({
        name: 'StatusPagamentosStatus',
        columnNames: ['pagamento_id'],
        referencedTableName: 'pagamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
