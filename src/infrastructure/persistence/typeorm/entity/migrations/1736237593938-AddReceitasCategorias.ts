import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddReceitasCategorias1736237593938 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'receitas',
      new TableColumn({
        name: 'categoria_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'receitas',
      new TableForeignKey({
        name: 'ReceitasCategoria',
        columnNames: ['categoria_id'],
        referencedTableName: 'categorias',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
