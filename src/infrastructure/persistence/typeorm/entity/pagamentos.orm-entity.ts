import { StatusOrmEntity } from './status.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pagamentos')
export class PagamentosOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;
  @Column()
  name!: string;
  @CreateDateColumn()
  created_at!: Date;
  @CreateDateColumn()
  updated_at!: Date;
  @Column()
  status_id!: string;
  @ManyToOne(() => StatusOrmEntity, (status) => status.id, { eager: true })
  @JoinColumn({ name: 'status_id', referencedColumnName: 'id' })
  status!: StatusOrmEntity;
}
