import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('status')
export class StatusOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;
  @Column('varchar')
  name!: string;
  @CreateDateColumn({ select: false })
  created_at!: Date;
  @CreateDateColumn({ select: false })
  updated_at!: Date;
}
