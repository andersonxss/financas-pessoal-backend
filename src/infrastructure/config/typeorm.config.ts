import { DataSource, DataSourceOptions } from "typeorm";
import { UserOrmEntity, StatusOrmEntity, CategoriaOrmEntity, ParcelaOrmEntity, PagamentosOrmEntity, DespesasOrmEntity, ReceitasOrmEntity, TenantOrmEntity, InviteOrmEntity, AuthTokenOrmEntity } from '@persistence';
import { ConfigService } from '@nestjs/config';
import { CreateUsers1769282925425 } from "src/infrastructure/persistence/typeorm/entity/migrations/1769282925425-CreateUsers";
import { EnterpriseAuthMultiTenancy1793923300000 } from "src/infrastructure/persistence/typeorm/entity/migrations/1793923300000-EnterpriseAuthMultiTenancy";


export const getTypeOrmConfig = (configService: ConfigService): DataSourceOptions => {
    return {
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_APP_USER') ?? configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_APP_PASSWORD') ?? configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [UserOrmEntity, StatusOrmEntity, CategoriaOrmEntity, ParcelaOrmEntity, PagamentosOrmEntity, DespesasOrmEntity, ReceitasOrmEntity, TenantOrmEntity, InviteOrmEntity, AuthTokenOrmEntity],
        synchronize: false,
        // Runtime uses a restricted role. Migrations run separately with the
        // owner credentials through `npm run migration:run` / Compose `migrate`.
        migrationsRun: false,
        migrations: [CreateUsers1769282925425, EnterpriseAuthMultiTenancy1793923300000],
    };
}


export const connectionSource = (configService: ConfigService) => {
    return new DataSource(getTypeOrmConfig(configService));
}
