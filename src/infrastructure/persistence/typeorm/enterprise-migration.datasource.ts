import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { DataSource } from 'typeorm';
import { AuthTokenOrmEntity } from './entity/auth-token.orm-entity';
import { CategoriaOrmEntity } from './entity/categoria.orm-entity';
import { DespesasOrmEntity } from './entity/despesas.orm-entity';
import { InviteOrmEntity } from './entity/invite.orm-entity';
import { PagamentosOrmEntity } from './entity/pagamentos.orm-entity';
import { ParcelaOrmEntity } from './entity/parcelas.orm-entity';
import { ReceitasOrmEntity } from './entity/receitas.orm-entity';
import { StatusOrmEntity } from './entity/status.orm-entity';
import { TenantOrmEntity } from './entity/tenant.orm-entity';
import { UserOrmEntity } from './entity/user.orm-entity';
import { CreateUsers1769282925425 } from './entity/migrations/1769282925425-CreateUsers';
import { EnterpriseAuthMultiTenancy1793923300000 } from './entity/migrations/1793923300000-EnterpriseAuthMultiTenancy';

// Explicit migration CLI datasource; application bootstrap has its own config.
if (existsSync('.env')) loadEnvFile('.env');

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    UserOrmEntity,
    StatusOrmEntity,
    CategoriaOrmEntity,
    ParcelaOrmEntity,
    PagamentosOrmEntity,
    DespesasOrmEntity,
    ReceitasOrmEntity,
    TenantOrmEntity,
    InviteOrmEntity,
    AuthTokenOrmEntity,
  ],
  synchronize: false,
  migrationsRun: false,
  migrationsTransactionMode: 'all',
  migrations: [
    CreateUsers1769282925425,
    EnterpriseAuthMultiTenancy1793923300000,
  ],
});
