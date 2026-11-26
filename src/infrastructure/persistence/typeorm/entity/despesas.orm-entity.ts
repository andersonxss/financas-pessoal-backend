import { moneyTransformer } from "../money.transformer";
import { CategoriaOrmEntity } from './categoria.orm-entity';
import { PagamentosOrmEntity } from './pagamentos.orm-entity';
import { ParcelaOrmEntity } from './parcelas.orm-entity';
import { StatusOrmEntity } from './status.orm-entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('gastos')
export class DespesasOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;
  @Column()
  descricao!: string;
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: moneyTransformer })
  valor!: number;
  @Column({ type: 'timestamp without time zone' })
  vencimento!: Date;
  @CreateDateColumn()
  created_at!: Date;
  @CreateDateColumn()
  updated_at!: Date;
  @Column()
  categoria_id!: string;
  @Column()
  status_id!: string;
  @Column()
  parcela_id!: string;
  @Column()
  pagamento_id!: string;

  @ManyToOne(() => CategoriaOrmEntity, (categoria) => categoria.id, {
    eager: true,
  })
  @JoinColumn({ name: 'categoria_id', referencedColumnName: 'id' })
  categoria!: CategoriaOrmEntity;

  @ManyToOne(() => ParcelaOrmEntity, (parcela) => parcela.id, { eager: true })
  @JoinColumn({ name: 'parcela_id', referencedColumnName: 'id' })
  parcela!: ParcelaOrmEntity;

  @ManyToOne(() => StatusOrmEntity, (status) => status.id, { eager: true })
  @JoinColumn({ name: 'status_id', referencedColumnName: 'id' })
  status!: StatusOrmEntity;

  @ManyToOne(() => PagamentosOrmEntity, (pagamento) => pagamento.id, {
    eager: true,
  })
  @JoinColumn({ name: 'pagamento_id', referencedColumnName: 'id' })
  pagamento!: PagamentosOrmEntity;
}
