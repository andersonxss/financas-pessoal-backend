
import { IStatusRepository } from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusOrmEntity } from "../typeorm/entity/status.orm-entity";
import { Repository } from "typeorm";
import { Status } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class StatusRepositoryTypeorm implements IStatusRepository {
    constructor(
        @InjectRepository(StatusOrmEntity)
        private readonly ormRepository: Repository<StatusOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<StatusOrmEntity> {
        return this.tenantContext.manager?.getRepository(StatusOrmEntity) ?? this.ormRepository;
    }

    async save(status: Status): Promise<Status> {
        const statusCreated = await this.repository.save({ ...status, tenantId: this.tenantContext.requireTenantId() });
        return statusCreated;
    }

    async update(status: Status): Promise<Status> {
        const statusUpdated = await this.repository.save({ ...status, tenantId: this.tenantContext.requireTenantId() });
        return statusUpdated;
    }

    async findByName(name: string): Promise<Status | any> {
        const status = await this.repository.findOne({ where: { name, tenantId: this.tenantContext.requireTenantId() } });
        return status
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }

    async findAll(): Promise<Status[]> {
        const status = await this.repository.find({ where: { tenantId: this.tenantContext.requireTenantId() } });
        return status;
    }

    async findById(id: string): Promise<Status | any> {
        const status = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return status
    }

}
