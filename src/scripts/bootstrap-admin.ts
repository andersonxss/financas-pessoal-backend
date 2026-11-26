import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UserRole } from '@entities';
import { TenantOrmEntity, UserOrmEntity } from '@persistence';
import { connectionSource } from '@infrastructure/config';

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const tenantSlug = process.env.BOOTSTRAP_TENANT_SLUG?.trim().toLowerCase() ?? 'principal';

  if (!email || !name || !password || password.length < 12) {
    throw new Error('Defina BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD (mínimo de 12 caracteres)');
  }

  const dataSource = connectionSource(new ConfigService(process.env));
  await dataSource.initialize();
  try {
    const tenant = await dataSource.getRepository(TenantOrmEntity).findOne({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error(`Tenant ${tenantSlug} não encontrado; execute as migrations primeiro`);

    await dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('app.tenant_id', $1, true), set_config('app.user_role', 'SUPER_ADMIN', true)`,
        [tenant.id],
      );
      const repository = manager.getRepository(UserOrmEntity);
      const existing = await repository.createQueryBuilder('user')
        .where('user.tenantId = :tenantId', { tenantId: tenant.id })
        .andWhere('LOWER(user.email) = :email', { email })
        .getOne();
      const passwordHash = await bcrypt.hash(password, 12);
      if (existing) {
        await repository.update(
          { id: existing.id, tenantId: tenant.id },
          { name, password: passwordHash, role: UserRole.SUPER_ADMIN, active: true, refreshTokenHash: null },
        );
      } else {
        await repository.save(repository.create({ tenantId: tenant.id, name, email, password: passwordHash, role: UserRole.SUPER_ADMIN, active: true, refreshTokenHash: null }));
      }
    });
    process.stdout.write(`Superadministrador preparado no tenant ${tenantSlug}.\n`);
  } finally {
    await dataSource.destroy();
  }
}

bootstrapAdmin().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha no bootstrap'}\n`);
  process.exitCode = 1;
});
