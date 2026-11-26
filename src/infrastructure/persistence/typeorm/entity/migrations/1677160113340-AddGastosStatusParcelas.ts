import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddGastosStatusParcelas1677160113340 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'gastos',
      new TableColumn({
        name: 'status_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'gastos',
      new TableColumn({
        name: 'categoria_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'gastos',
      new TableForeignKey({
        name: 'StatusGastosStatus',
        columnNames: ['status_id'],
        referencedTableName: 'status',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'gastos',
      new TableForeignKey({
        name: 'CategoriasGastosCategorias',
        columnNames: ['categoria_id'],
        referencedTableName: 'categorias',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
