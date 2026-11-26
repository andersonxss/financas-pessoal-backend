import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddGastosStatusCategoriaParcelas1677350483088 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'gastos',
      new TableColumn({
        name: 'parcela_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'gastos',
      new TableForeignKey({
        name: 'ParcelasGastosParcelas',
        columnNames: ['parcela_id'],
        referencedTableName: 'parcelas',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
