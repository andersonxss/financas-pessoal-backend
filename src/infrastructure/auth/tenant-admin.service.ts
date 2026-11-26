import { UserRole } from '@entities';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { isUUID } from 'class-validator';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { InviteOrmEntity, TenantOrmEntity, UserOrmEntity } from '@persistence';
import { EmailService } from '../email/email.service';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantAdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) { }

  async listTenants(page: number, limit: number) {
    const [items, total] = await this.manager().getRepository(TenantOrmEntity).findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async createTenant(input: { name: string; slug: string; adminEmail: string }, invitedBy: string) {
    const repository = this.manager().getRepository(TenantOrmEntity);
    const slug = input.slug.trim().toLowerCase();
    if (await repository.findOne({ where: { slug } })) {
      throw new ConflictException('Este identificador de tenant já está em uso');
    }
    const tenant = await repository.save(repository.create({ name: input.name.trim(), slug, active: true }));
    const invite = await this.createInvite(input.adminEmail, UserRole.ADMIN, invitedBy, tenant.id);
    return { tenant, invite };
  }

  async updateTenant(id: string, input: { name?: string; active?: boolean }) {
    const repository = this.manager().getRepository(TenantOrmEntity);
    const tenant = await repository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    if (input.name !== undefined) tenant.name = input.name.trim();
    if (input.active !== undefined) tenant.active = input.active;
    return repository.save(tenant);
  }

  async listMembers(page: number, limit: number) {
    const tenantId = this.tenantContext.requireTenantId();
    const [items, total] = await this.manager().getRepository(UserOrmEntity).findAndCount({
      where: { tenantId },
      order: { name: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async listInvites(page: number, limit: number) {
    const tenantId = this.tenantContext.requireTenantId();
    const [items, total] = await this.manager().getRepository(InviteOrmEntity).findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async createInvite(email: string, role: UserRole, invitedBy: string, tenantId?: string) {
    const targetTenantId = tenantId ?? this.tenantContext.requireTenantId();
    if (role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Convites não podem conceder o papel SUPER_ADMIN');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const manager = this.manager();
    const existingUser = await manager.getRepository(UserOrmEntity).createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId: targetTenantId })
      .andWhere('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();
    if (existingUser) throw new ConflictException('Este e-mail já pertence ao tenant');

    const repository = manager.getRepository(InviteOrmEntity);
    const activeInvite = await repository.createQueryBuilder('invite')
      .where('invite.tenantId = :tenantId', { tenantId: targetTenantId })
      .andWhere('LOWER(invite.email) = :email', { email: normalizedEmail })
      .andWhere('invite.acceptedAt IS NULL')
      .andWhere('invite.expiresAt > NOW()')
      .getOne();
    if (activeInvite) throw new ConflictException('Já existe um convite ativo para este e-mail');

    const invite = await repository.save(repository.create({
      tenantId: targetTenantId,
      email: normalizedEmail,
      role,
      tokenHash: 'pending',
      invitedBy,
      expiresAt: new Date(Date.now() + 72 * 60 * 60_000),
      acceptedAt: null,
    }));
    const token = `${targetTenantId}.${invite.id}.${randomBytes(32).toString('base64url')}`;
    invite.tokenHash = this.hash(token);
    await repository.save(invite);
    const inviteUrl = `${this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'}/aceitar-convite?token=${encodeURIComponent(token)}`;
    const delivered = await this.email.sendLink({
      to: normalizedEmail,
      subject: 'Convite para o Finance Sistem',
      title: 'Seu espaço financeiro está pronto',
      message: 'Você foi convidado para participar de uma organização. O convite expira em 72 horas e só pode ser usado uma vez.',
      actionLabel: 'Aceitar convite',
      actionUrl: inviteUrl,
    });
    const { tokenHash: _tokenHash, ...publicInvite } = invite;
    return { ...publicInvite, inviteUrl, delivered };
  }

  async revokeInvite(id: string): Promise<void> {
    const result = await this.manager().getRepository(InviteOrmEntity).delete({
      id,
      tenantId: this.tenantContext.requireTenantId(),
      acceptedAt: IsNull(),
    });
    if (!result.affected) throw new NotFoundException('Convite pendente não encontrado');
  }

  async acceptInvite(token: string, name: string, password: string) {

    const parts = token.split('.');

    if (parts.length !== 3 || !isUUID(parts[0], 4) || !isUUID(parts[1], 4)) {
      throw new BadRequestException('Convite inválido');
    }
    const [tenantId, inviteId] = parts;
    return this.tenantContext.runInTransaction(
      this.dataSource,
      { tenantId, userId: inviteId, role: UserRole.MEMBER },
      async () => {
        const manager = this.manager();
        const repository = manager.getRepository(InviteOrmEntity);
        const invite = await repository.createQueryBuilder('invite')
          .addSelect('invite.tokenHash')
          .setLock('pessimistic_write')
          .where('invite.id = :inviteId', { inviteId })
          .andWhere('invite.tenantId = :tenantId', { tenantId })
          .getOne();
        if (!invite || invite.acceptedAt || invite.expiresAt <= new Date() || invite.tokenHash !== this.hash(token)) {
          throw new BadRequestException('Convite inválido ou expirado');
        }
        const userRepository = manager.getRepository(UserOrmEntity);
        const user = await userRepository.save(userRepository.create({
          tenantId,
          name: name.trim(),
          email: invite.email,
          password: await bcrypt.hash(password, 12),
          role: invite.role,
          active: true,
          refreshTokenHash: null,
        }));
        invite.acceptedAt = new Date();
        await repository.save(invite);
        const tenant = await manager.getRepository(TenantOrmEntity).findOne({ where: { id: tenantId } });
        return { userId: user.id, tenant: tenant?.slug ?? null };
      },
    );
  }

  private manager(): EntityManager {
    return this.tenantContext.manager ?? this.dataSource.manager;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
