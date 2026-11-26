
import { ICategoriaRepository } from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoriaOrmEntity } from "../typeorm/entity/categoria.orm-entity";
import { Repository } from "typeorm";
import { Categoria } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class CategoriaRepositoryTypeorm implements ICategoriaRepository {
    constructor(
        @InjectRepository(CategoriaOrmEntity)
        private readonly ormRepository: Repository<CategoriaOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<CategoriaOrmEntity> {
        return this.tenantContext.manager?.getRepository(CategoriaOrmEntity) ?? this.ormRepository;
    }

    async save(categoria: Categoria): Promise<Categoria> {
        const categoriaCreated = await this.repository.save({ ...categoria, tenantId: this.tenantContext.requireTenantId() });
        return categoriaCreated;
    }

    async update(categoria: Categoria): Promise<Categoria> {
        const categoriaUpdated = await this.repository.save({ ...categoria, tenantId: this.tenantContext.requireTenantId() });
        return categoriaUpdated;
    }

    async findByName(name: string): Promise<Categoria | any> {
        const categoria = await this.repository.findOne({ where: { name, tenantId: this.tenantContext.requireTenantId() } });
        return categoria
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }

    async findAll(): Promise<Categoria[]> {
        const categoria = await this.repository.find({ where: { tenantId: this.tenantContext.requireTenantId() } });
        return categoria;
    }

    async findById(id: string): Promise<Categoria | any> {
        const categoria = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return categoria
    }

}
