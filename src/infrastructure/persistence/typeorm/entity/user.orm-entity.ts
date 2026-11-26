import { UserRole } from '../../../../domain/entities/tenant.entity';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column('varchar', { length: 20, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ default: true })
  active!: boolean;

  @Column('varchar', { name: 'refresh_token_hash', nullable: true, select: false })
  refreshTokenHash!: string | null;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
