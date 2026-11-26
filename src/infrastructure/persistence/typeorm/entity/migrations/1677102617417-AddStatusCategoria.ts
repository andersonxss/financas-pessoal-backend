import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddStatusCategoria1677102617417 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'categorias',
      new TableColumn({
        name: 'status_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'categorias',
      new TableForeignKey({
        name: 'StatusCategoriasStatus',
        columnNames: ['status_id'],
        referencedTableName: 'status',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
