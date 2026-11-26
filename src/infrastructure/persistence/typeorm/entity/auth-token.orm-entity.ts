import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuthTokenType {
  PASSWORD_RESET = 'PASSWORD_RESET',
}

@Entity('auth_tokens')
@Index(['tenantId', 'userId', 'type'])
export class AuthTokenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar', { length: 30 })
  type!: AuthTokenType;

  @Column('varchar', { name: 'token_hash', length: 64, select: false })
  tokenHash!: string;

  @Column('timestamp with time zone', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamp with time zone', { name: 'used_at', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
