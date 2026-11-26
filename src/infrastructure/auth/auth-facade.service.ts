import { UserRole } from '@entities';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
} from '../config/auth-session';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { AuthTokenOrmEntity, AuthTokenType, TenantOrmEntity, UserOrmEntity } from '@persistence';
import { EmailService } from '../email/email.service';
import type { AuthenticatedUser } from './auth.types';
import { TenantContextService } from './tenant-context.service';

const DUMMY_PASSWORD_HASH = '$2b$12$vPJ8zWfOAcDTq8PZmlhHw.vCAFZgpP1K6HP.MjU6lSBwRPqNYqhCK';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: Omit<AuthenticatedUser, 'type'>;
}

@Injectable()
export class AuthFacadeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tenantContext: TenantContextService,
    private readonly email: EmailService,
  ) {}

  async login(tenantSlug: string, email: string, password: string): Promise<AuthResult> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.tenantContext.runInTransaction(
      this.dataSource,
      { tenantId: tenant.id, userId: tenant.id, role: UserRole.MEMBER },
      async () => {
        const repository = this.manager().getRepository(UserOrmEntity);
        const user = await repository.createQueryBuilder('user')
          .addSelect(['user.password', 'user.refreshTokenHash'])
          .where('user.tenantId = :tenantId', { tenantId: tenant.id })
          .andWhere('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
          .getOne();
        if (!user?.active || !(await bcrypt.compare(password, user.password))) {
          throw new UnauthorizedException('Credenciais inválidas');
        }
        return this.issueSession(repository, user);
      },
    );
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthenticatedUser>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') throw new Error('invalid token type');
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
    return this.tenantContext.runInTransaction(
      this.dataSource,
      { tenantId: payload.tenantId, userId: payload.userId, role: payload.role },
      async () => {
        const manager = this.manager();
        const tenant = await manager.getRepository(TenantOrmEntity).findOne({
          where: { id: payload.tenantId, active: true },
        });
        if (!tenant) {
          throw new UnauthorizedException('Tenant inativo ou inexistente');
        }

        const repository = manager.getRepository(UserOrmEntity);
        const user = await repository.createQueryBuilder('user')
          .addSelect('user.refreshTokenHash')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: payload.userId })
          .andWhere('user.tenantId = :tenantId', { tenantId: payload.tenantId })
          .getOne();
        if (!user?.active || !user.refreshTokenHash || this.hash(refreshToken) !== user.refreshTokenHash) {
          throw new UnauthorizedException('Refresh token revogado');
        }
        return this.issueSession(repository, user);
      },
    );
  }

  async logout(userId: string): Promise<void> {
    await this.manager().getRepository(UserOrmEntity).update(
      { id: userId, tenantId: this.tenantContext.requireTenantId() },
      { refreshTokenHash: null },
    );
  }

  async me(userId: string) {
    const user = await this.manager().getRepository(UserOrmEntity).findOne({
      where: { id: userId, tenantId: this.tenantContext.requireTenantId(), active: true },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return this.publicUser(user);
  }

  async requestRecovery(tenantSlug: string, email: string): Promise<void> {
    const tenant = await this.resolveTenant(tenantSlug);
    if (!tenant) return;
    await this.tenantContext.runInTransaction(
      this.dataSource,
      { tenantId: tenant.id, userId: tenant.id, role: UserRole.MEMBER },
      async () => {
        const manager = this.manager();
        const user = await manager.getRepository(UserOrmEntity).createQueryBuilder('user')
          .where('user.tenantId = :tenantId', { tenantId: tenant.id })
          .andWhere('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
          .andWhere('user.active = true')
          .getOne();
        if (!user) return;
        const repository = manager.getRepository(AuthTokenOrmEntity);
        await repository.update(
          { tenantId: tenant.id, userId: user.id, type: AuthTokenType.PASSWORD_RESET, usedAt: IsNull() },
          { usedAt: new Date() },
        );
        const record = await repository.save(repository.create({
          tenantId: tenant.id,
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          tokenHash: 'pending',
          expiresAt: new Date(Date.now() + 30 * 60_000),
          usedAt: null,
        }));
        const token = `${tenant.id}.${record.id}.${randomBytes(32).toString('base64url')}`;
        record.tokenHash = this.hash(token);
        await repository.save(record);
        const resetUrl = `${this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(token)}`;
        await this.email.sendLink({
          to: user.email,
          subject: 'Redefina sua senha',
          title: 'Recupere seu acesso',
          message: 'Recebemos uma solicitação de troca de senha. O link expira em 30 minutos e só pode ser usado uma vez.',
          actionLabel: 'Criar nova senha',
          actionUrl: resetUrl,
        }).catch(() => false);
      },
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const parts = token.split('.');
    if (parts.length !== 3 || !isUUID(parts[0], 4) || !isUUID(parts[1], 4)) {
      throw new BadRequestException('Token de recuperação inválido');
    }
    const [tenantId, tokenId] = parts;
    await this.tenantContext.runInTransaction(
      this.dataSource,
      { tenantId, userId: tokenId, role: UserRole.MEMBER },
      async () => {
        const manager = this.manager();
        const record = await manager.getRepository(AuthTokenOrmEntity).createQueryBuilder('token')
          .addSelect('token.tokenHash')
          .setLock('pessimistic_write')
          .where('token.id = :tokenId', { tokenId })
          .andWhere('token.tenantId = :tenantId', { tenantId })
          .andWhere('token.type = :type', { type: AuthTokenType.PASSWORD_RESET })
          .getOne();
        if (!record || record.usedAt || record.expiresAt <= new Date() || record.tokenHash !== this.hash(token)) {
          throw new BadRequestException('Token de recuperação inválido ou expirado');
        }
        await manager.getRepository(UserOrmEntity).update(
          { id: record.userId, tenantId },
          { password: await bcrypt.hash(password, 12), refreshTokenHash: null },
        );
        record.usedAt = new Date();
        await manager.getRepository(AuthTokenOrmEntity).save(record);
      },
    );
  }

  private async issueSession(repository: Repository<UserOrmEntity>, rawUser: UserOrmEntity): Promise<AuthResult> {
    const user = this.publicUser(rawUser);
    const accessToken = await this.jwtService.signAsync(
      { ...user, type: 'access' },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? DEFAULT_ACCESS_TOKEN_EXPIRES_IN) as never },
    );
    const refreshToken = await this.jwtService.signAsync(
      { ...user, type: 'refresh' },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? DEFAULT_REFRESH_TOKEN_EXPIRES_IN) as never },
    );
    await repository.update(
      { id: rawUser.id, tenantId: rawUser.tenantId },
      { refreshTokenHash: this.hash(refreshToken) },
    );
    return { accessToken, refreshToken, user };
  }

  private publicUser(user: UserOrmEntity): Omit<AuthenticatedUser, 'type'> {
    return { userId: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
  }

  private resolveTenant(slug: string): Promise<TenantOrmEntity | null> {
    return this.dataSource.getRepository(TenantOrmEntity).findOne({
      where: { slug: slug.trim().toLowerCase(), active: true },
    });
  }

  private manager(): EntityManager {
    return this.tenantContext.manager ?? this.dataSource.manager;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
