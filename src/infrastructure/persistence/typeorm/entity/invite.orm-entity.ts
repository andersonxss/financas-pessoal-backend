import { UserRole } from '../../../../domain/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tenant_invites')
@Index(['tenantId', 'email'])
export class InviteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column('varchar', { length: 254 })
  email!: string;

  @Column('varchar', { length: 20, default: UserRole.MEMBER })
  role!: UserRole;

  @Column('varchar', { name: 'token_hash', length: 64, select: false })
  tokenHash!: string;

  @Column('uuid', { name: 'invited_by' })
  invitedBy!: string;

  @Column('timestamp with time zone', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamp with time zone', { name: 'accepted_at', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
