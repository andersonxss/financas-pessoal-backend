
import { IParcelasRepository } from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { ParcelaOrmEntity } from "../typeorm/entity/parcelas.orm-entity";
import { Repository } from "typeorm";
import { Parcelas } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class ParcelasRepositoryTypeorm implements IParcelasRepository {
    constructor(
        @InjectRepository(ParcelaOrmEntity)
        private readonly ormRepository: Repository<ParcelaOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<ParcelaOrmEntity> {
        return this.tenantContext.manager?.getRepository(ParcelaOrmEntity) ?? this.ormRepository;
    }

    async save(parcelas: Parcelas): Promise<Parcelas> {
        const parcelasCreated = await this.repository.save({ ...parcelas, tenantId: this.tenantContext.requireTenantId() });
        return parcelasCreated;
    }

    async update(parcelas: Parcelas): Promise<Parcelas> {
        const parcelasUpdated = await this.repository.save({ ...parcelas, tenantId: this.tenantContext.requireTenantId() });
        return parcelasUpdated;
    }

    async findByName(name: string): Promise<Parcelas | any> {
        const parcelas = await this.repository.findOne({ where: { name, tenantId: this.tenantContext.requireTenantId() } });
        return parcelas
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }

    async findAll(): Promise<Parcelas[]> {
        const parcelas = await this.repository.find({ where: { tenantId: this.tenantContext.requireTenantId() } });
        return parcelas;
    }

    async findById(id: string): Promise<Parcelas | any> {
        const parcelas = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return parcelas
    }

    async findShowParcela(id: string): Promise<Parcelas | null> {
        const parcela = this.repository.findOne({
            where: {
                id,
                tenantId: this.tenantContext.requireTenantId(),
            },
            relations: ['status'],
        });
        return parcela;
    }

}
