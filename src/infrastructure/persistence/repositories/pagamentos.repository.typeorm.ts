
import { IPagamentosRepository } from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { PagamentosOrmEntity } from "../typeorm/entity/pagamentos.orm-entity";
import { Repository } from "typeorm";
import { Pagamentos } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class PagamentosRepositoryTypeorm implements IPagamentosRepository {
    constructor(
        @InjectRepository(PagamentosOrmEntity)
        private readonly ormRepository: Repository<PagamentosOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<PagamentosOrmEntity> {
        return this.tenantContext.manager?.getRepository(PagamentosOrmEntity) ?? this.ormRepository;
    }

    async save(pagamentos: Pagamentos): Promise<Pagamentos> {
        const pagamentosCreated = await this.repository.save({ ...pagamentos, tenantId: this.tenantContext.requireTenantId() });
        return pagamentosCreated;
    }

    async update(pagamentos: Pagamentos): Promise<Pagamentos> {
        const pagamentosUpdated = await this.repository.save({ ...pagamentos, tenantId: this.tenantContext.requireTenantId() });
        return pagamentosUpdated;
    }

    async findByName(name: string): Promise<Pagamentos | any> {
        const pagamentos = await this.repository.findOne({ where: { name, tenantId: this.tenantContext.requireTenantId() } });
        return pagamentos
    }

    async findAll(): Promise<Pagamentos[]> {
        const pagamentos = await this.repository.find({ where: { tenantId: this.tenantContext.requireTenantId() } });
        return pagamentos;
    }

    async findById(id: string): Promise<Pagamentos | any> {
        const pagamentos = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return pagamentos
    }

}
