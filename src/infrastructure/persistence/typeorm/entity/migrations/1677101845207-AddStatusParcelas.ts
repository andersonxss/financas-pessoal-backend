import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddStatusParcelas1677101845207 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'parcelas',
      new TableColumn({
        name: 'status_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'parcelas',
      new TableForeignKey({
        name: 'StatusParcelasStatus',
        columnNames: ['status_id'],
        referencedTableName: 'status',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(): Promise<void> {}
}
