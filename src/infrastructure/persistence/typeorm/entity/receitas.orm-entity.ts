import { moneyTransformer } from "../money.transformer";
import { CategoriaOrmEntity } from './categoria.orm-entity';
import { StatusOrmEntity } from './status.orm-entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('receitas')
export class ReceitasOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;
  @Column()
  descricao!: string;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: moneyTransformer,
  })
  valor!: number;
  @Column({ type: 'timestamp without time zone' })
  recebimento!: Date;
  @CreateDateColumn()
  created_at!: Date;
  @UpdateDateColumn()
  updated_at!: Date;
  @Column()
  categoria_id!: string;
  @Column()
  status_id!: string;

  @ManyToOne(() => CategoriaOrmEntity, (categoria) => categoria.id, {
    eager: true,
  })
  @JoinColumn({ name: 'categoria_id', referencedColumnName: 'id' })
  categoria!: CategoriaOrmEntity;

  @ManyToOne(() => StatusOrmEntity, (status) => status.id, { eager: true })
  @JoinColumn({ name: 'status_id', referencedColumnName: 'id' })
  status!: StatusOrmEntity;
}
