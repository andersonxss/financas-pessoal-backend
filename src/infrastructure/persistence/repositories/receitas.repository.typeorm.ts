
import {
	IReceitasRepository,
	type IReceitasTotalMensal,
} from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { ReceitasOrmEntity } from "../typeorm/entity/receitas.orm-entity";
import { Between, Repository } from "typeorm";
import { Receitas } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";


export class ReceitasRepositoryTypeorm implements IReceitasRepository {
    constructor(
        @InjectRepository(ReceitasOrmEntity)
        private readonly ormRepository: Repository<ReceitasOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<ReceitasOrmEntity> {
        return this.tenantContext.manager?.getRepository(ReceitasOrmEntity) ?? this.ormRepository;
    }

    async save(receitas: Receitas): Promise<Receitas> {
        const receitasCreated = await this.repository.save({ ...receitas, tenantId: this.tenantContext.requireTenantId() });
        return receitasCreated;
    }

    async update(receitas: Receitas): Promise<Receitas> {
        const receitasUpdated = await this.repository.save({ ...receitas, tenantId: this.tenantContext.requireTenantId() });
        return receitasUpdated;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }

    async findAll(ano: number, mes: number): Promise<Receitas[]> {
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0, 23, 59, 59, 999);

        const receitas = await this.repository.find({
			where: {
				tenantId: this.tenantContext.requireTenantId(),
				recebimento: Between(primeiroDia, ultimoDia),
			},
			order: { recebimento: "ASC" },
		});
        return receitas;
    }

	async findById(id: string): Promise<Receitas | null> {
		const receitas = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
		return receitas;
    }

	async findAllAno(ano: number): Promise<Receitas[]> {
        const primeiroDia = new Date(ano, 0, 1);
        const ultimoDia = new Date(ano, 11, 31, 23, 59, 59, 999);

        const receitas = this.repository.find({
            where: {
                tenantId: this.tenantContext.requireTenantId(),
                recebimento: Between(primeiroDia, ultimoDia),
            },
        });
        return receitas;
    }

	public async findAllMes(mes: number): Promise<Receitas[]> {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesEscolhido = Number(mes); // Certifique-se de que seja um número válido

        // Obtém o primeiro e último dia do mês escolhido
        const primeiroDia = new Date(anoAtual, mesEscolhido - 1, 1); // Meses no JS começam do 0
        const ultimoDia = new Date(anoAtual, mesEscolhido, 0, 23, 59, 59, 999); // Último dia do mês

        const receitas = await this.repository.find({
            where: {
                tenantId: this.tenantContext.requireTenantId(),
                recebimento: Between(primeiroDia, ultimoDia),
            },
        });

        return receitas;
    }

	async findAllSomalTotalReceitasAno(
		ano: number,
	): Promise<IReceitasTotalMensal[]> {
        const result = await this.repository
            .createQueryBuilder('receitas')
            .select('EXTRACT(MONTH FROM receitas.recebimento)', 'month') // Extrai o mês
            .addSelect('SUM(CAST(receitas.valor AS DECIMAL(10,2)))', 'total') // Soma os valores
            .where('EXTRACT(YEAR FROM receitas.recebimento) = :year', {
                year: ano,
            })
            .andWhere('receitas.tenantId = :tenantId', { tenantId: this.tenantContext.requireTenantId() }) // Filtra pelo ano atual
            .groupBy('EXTRACT(MONTH FROM receitas.recebimento)') // Agrupa por mês
            .orderBy('EXTRACT(MONTH FROM receitas.recebimento)', 'ASC') // Ordena pelo mês
            .getRawMany();

        return result;
    }

}
